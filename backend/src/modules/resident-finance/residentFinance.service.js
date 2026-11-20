const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Resident = require('../residents/resident/resident.model');
const OwnerUnit = require('../residents/owner-unit/ownerUnit.model');
const Occupancy = require('../move-InOut/occupancy/occupancy.model');
const Invoice = require('../financial/invoice/invoice.model');
const InvoiceItem = require('../financial/invoice/invoiceItem.model');
const Payment = require('../financial/payment/payment.model');
const PreviousBalanceService = require('../financial/invoice/previousBalance.service');
const Razorpay = require('./razorpay.service');

const fail = (message, status = 400) => Object.assign(new Error(message), { status });

const responsibilitiesFor = (ownerUnits, occupancies) => [
  ...ownerUnits
    .filter((record) => record.status === 'ACTIVE' || record.effectiveTo)
    .map((record) => ({
      unitId: record.unitId,
      startDate: record.effectiveFrom,
      endDate: record.effectiveTo || null,
    })),
  ...occupancies
    .filter((record) => record.isCurrent || record.billingEndDate || record.endDate)
    .map((record) => ({
      unitId: record.unitId,
      startDate: record.billingStartDate || record.startDate,
      endDate: record.billingEndDate || record.endDate || null,
    })),
].filter((record) => record.unitId && record.startDate);

const dateIsWithin = (date, startDate, endDate) => (
  date >= String(startDate).slice(0, 10)
  && (!endDate || date <= String(endDate).slice(0, 10))
);

const getResident = async (user) => {
  const resident = await Resident.findOne({ where: { userId: user.id, societyId: user.societyId, status: 'ACTIVE' } });
  if (!resident) throw fail('No active resident profile is linked to this account', 404);
  const [ownerUnits, occupancies] = await Promise.all([
    OwnerUnit.findAll({ where: {
      ownerId: resident.id,
      societyId: user.societyId,
    } }),
    Occupancy.findAll({ where: {
      residentId: resident.id,
      societyId: user.societyId,
    } }),
  ]);
  const responsibilities = responsibilitiesFor(ownerUnits, occupancies);
  return {
    resident,
    responsibilities,
  };
};

exports.calculateMoveOutPendingAmount = async ({ societyId, unitId, residentId, requestedMoveOutDate, transaction = null }) => {
  const resident = await Resident.findOne({
    where: { id: residentId, societyId },
    ...(transaction ? { transaction } : {}),
  });
  if (!resident) throw fail('Resident does not belong to the selected society', 404);

  const [unit] = await sequelize.query(
    `SELECT u.id
       FROM units u
       JOIN floors f ON f.id = u.floor_id
       JOIN towers t ON t.id = f.tower_id
      WHERE u.id = :unitId AND t.society_id = :societyId
      LIMIT 1`,
    {
      replacements: { unitId, societyId },
      type: QueryTypes.SELECT,
      ...(transaction ? { transaction } : {}),
    },
  );
  if (!unit) throw fail('Unit does not belong to the selected society', 404);

  const [ownerUnits, occupancies] = await Promise.all([
    OwnerUnit.findAll({ where: { ownerId: resident.id, societyId, unitId }, ...(transaction ? { transaction } : {}) }),
    Occupancy.findAll({ where: { residentId: resident.id, societyId, unitId }, ...(transaction ? { transaction } : {}) }),
  ]);
  const responsibilities = responsibilitiesFor(ownerUnits, occupancies);
  const activeOnRequestedDate = responsibilities.some((record) => (
    record.unitId === unitId && dateIsWithin(requestedMoveOutDate, record.startDate, record.endDate)
  ));
  if (!activeOnRequestedDate) {
    throw fail('Resident has no eligible relationship with this unit on the requested move-out date', 422);
  }

  const invoices = await Invoice.findAll({
    where: {
      societyId,
      unitId,
      invoiceDate: { [Op.lte]: requestedMoveOutDate },
      status: { [Op.in]: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
      outstandingAmount: { [Op.gt]: 0 },
    },
    attributes: ['id', 'invoiceDate', 'outstandingAmount'],
    ...(transaction ? { transaction } : {}),
  });

  const eligibleInvoices = invoices.filter((invoice) => responsibilities.some((record) => (
    record.unitId === unitId && dateIsWithin(String(invoice.invoiceDate).slice(0, 10), record.startDate, record.endDate)
  )));
  const amountCents = eligibleInvoices.reduce((sum, invoice) => (
    sum + Math.round(Number(invoice.outstandingAmount) * 100)
  ), 0);

  return {
    amount: amountCents / 100,
    invoiceCount: eligibleInvoices.length,
    requestedMoveOutDate,
  };
};

const invoiceIsAuthorized = (invoice, resident, responsibilities) => {
  if (invoice.memberId === resident.id) return true;
  const invoiceDate = String(invoice.invoiceDate || '').slice(0, 10);
  if (!invoiceDate) return false;
  return responsibilities.some((responsibility) => (
    responsibility.unitId === invoice.unitId
    && invoiceDate >= String(responsibility.startDate).slice(0, 10)
    && (!responsibility.endDate || invoiceDate <= String(responsibility.endDate).slice(0, 10))
  ));
};

const residentInvoices = async (user, resident, responsibilities, where = {}) => {
  const unitIds = [...new Set(responsibilities.map((record) => record.unitId))];
  const invoices = await Invoice.findAll({
    where: {
    societyId: user.societyId,
    status: { [Op.in]: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'] },
    [Op.or]: [
      { memberId: resident.id },
      ...(unitIds.length ? [{ unitId: { [Op.in]: unitIds } }] : []),
    ],
    ...where,
    },
    include: [{ model: InvoiceItem, as: 'items' }],
    order: [['invoiceDate', 'DESC'], ['created_at', 'DESC']],
  });
  return invoices.filter((invoice) => invoiceIsAuthorized(invoice, resident, responsibilities));
};

exports.getDues = async (user) => {
  const { resident, responsibilities } = await getResident(user);
  const invoices = await residentInvoices(user, resident, responsibilities, { outstandingAmount: { [Op.gt]: 0 } });
  const balances = await PreviousBalanceService.getLivePreviousBalances(invoices);
  const eligibleInvoiceIds = new Set(invoices.map((invoice) => invoice.id));
  return invoices.map((invoice) => {
    const liveBalance = balances.get(invoice.id);
    const eligibleSources = (liveBalance?.sources || []).filter((source) => eligibleInvoiceIds.has(source.invoiceId));
    return {
      ...invoice.toJSON(),
      previousBalance: eligibleSources.reduce((sum, source) => sum + Number(source.outstandingAmount || 0), 0),
      previousBalanceSources: eligibleSources,
    };
  });
};

exports.getPayments = async (user) => {
  const { resident, responsibilities } = await getResident(user);
  const invoices = await residentInvoices(user, resident, responsibilities);
  const payments = await Payment.findAll({
    where: {
      societyId: user.societyId,
      memberId: resident.id,
    },
    order: [['createdAt', 'DESC']],
  });
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  return payments.map((payment) => ({
    ...payment.toJSON(),
    invoiceNumber: invoiceById.get(payment.invoiceId)?.invoiceNumber || null,
  }));
};

exports.initiatePayment = async (user, data) => {
  const { invoiceId, method, idempotencyKey } = data;
  if (!invoiceId || !idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length > 150) {
    throw fail('invoiceId and a valid idempotencyKey are required');
  }
  const methods = ['UPI', 'GOOGLE_PAY', 'PHONEPE', 'RUPAY_CARD', 'CASH', 'CHEQUE', 'NEFT', 'RTGS', 'BANK_TRANSFER'];
  if (!methods.includes(method)) throw fail('Unsupported payment method');

  const { resident, responsibilities } = await getResident(user);
  const transaction = await sequelize.transaction();
  try {
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, societyId: user.societyId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!invoice || !invoiceIsAuthorized(invoice, resident, responsibilities)) {
      throw fail('Invoice not found for this resident', 404);
    }
    if (!['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) || Number(invoice.outstandingAmount) <= 0) {
      throw fail('This invoice has no outstanding balance', 409);
    }

    const existing = await Payment.findOne({
      where: { societyId: user.societyId, idempotencyKey }, transaction,
    });
    if (existing) {
      if (existing.invoiceId !== invoice.id || existing.memberId !== resident.id) {
        throw fail('This idempotency key has already been used', 409);
      }
      await transaction.commit();
      return {
        duplicate: true,
        payment: existing,
        invoiceNumber: invoice.invoiceNumber,
        billingPeriod: invoice.billingPeriod,
      };
    }

    const pending = await Payment.findOne({
      where: {
        societyId: user.societyId,
        invoiceId: invoice.id,
        status: { [Op.in]: ['INITIATED', 'PENDING', 'VERIFICATION_PENDING'] },
      },
      transaction,
    });
    if (pending) {
      await transaction.commit();
      if (pending.paymentChannel === 'GATEWAY') {
        let order = pending.gatewayOrderId ? await Razorpay.fetchOrder(pending.gatewayOrderId) : null;
        if (!order) {
          order = await Razorpay.createOrder(pending);
          await pending.update({ gatewayName: 'RAZORPAY', gatewayOrderId: order.id });
        }
        return {
          duplicate: true,
          payment: { ...pending.toJSON(), gatewayOrderId: order.id, checkout: { keyId: Razorpay.keyId(), orderId: order.id, amount: order.amount, currency: order.currency } },
          invoiceNumber: invoice.invoiceNumber,
          billingPeriod: invoice.billingPeriod,
        };
      }
      // For offline payments, block as before to prevent duplicate offline records.
      throw fail('A payment attempt for this invoice is already awaiting confirmation', 409);
    }

    // Amount and account associations come only from the locked invoice record.
    const amount = data.amount == null
      ? Number(invoice.outstandingAmount)
      : Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(invoice.outstandingAmount)) {
      throw fail('Payment amount must be positive and cannot exceed the outstanding balance');
    }

    const offline = ['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'BANK_TRANSFER'].includes(method);
    const payment = await Payment.create({
      societyId: user.societyId,
      invoiceId: invoice.id,
      unitId: invoice.unitId,
      memberId: resident.id,
      paymentReference: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      paymentMethod: method,
      paymentChannel: offline ? 'OFFLINE' : 'GATEWAY',
      amount,
      paymentDate: new Date(),
      status: offline ? 'VERIFICATION_PENDING' : 'INITIATED',
      gatewayName: offline ? null : 'RAZORPAY',
      gatewayOrderId: null,
      idempotencyKey,
      metadata: { source: 'RESIDENT_APP', selectedMethod: method, residentId: resident.id },
      remarks: data.remarks || null,
    }, { transaction });
    await transaction.commit();
    if (!offline) {
      try {
        const order = await Razorpay.createOrder(payment);
        await payment.update({ gatewayOrderId: order.id });
        payment.checkout = { keyId: Razorpay.keyId(), orderId: order.id, amount: order.amount, currency: order.currency };
      } catch (error) {
        await payment.update({ status: 'FAILED', remarks: 'Razorpay order creation failed' });
        throw error;
      }
    }
    return {
      duplicate: false,
      payment,
      invoiceNumber: invoice.invoiceNumber,
      billingPeriod: invoice.billingPeriod,
    };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      const existing = await Payment.findOne({ where: { societyId: user.societyId, idempotencyKey } });
      if (existing && existing.invoiceId === invoiceId && existing.memberId === resident.id) {
        return { duplicate: true, payment: existing };
      }
    }
    throw error;
  }
};

exports.verifyRazorpayPayment = async (user, paymentId, details) => {
  const { resident, responsibilities } = await getResident(user);
  const payment = await Payment.findOne({ where: { id: paymentId, societyId: user.societyId, memberId: resident.id, paymentChannel: 'GATEWAY' } });
  if (!payment) throw fail('Payment not found', 404);
  const invoice = await Invoice.findOne({ where: { id: payment.invoiceId, societyId: user.societyId } });
  if (!invoice || !invoiceIsAuthorized(invoice, resident, responsibilities)) throw fail('Payment not found', 404);
  if (['SUCCESS', 'VERIFIED'].includes(payment.status) && payment.journalId) {
    return { status: payment.status, duplicate: true, payment };
  }
  if (!details?.razorpay_payment_id || details.razorpay_order_id !== payment.gatewayOrderId || !details.razorpay_signature) {
    throw fail('Razorpay order details do not match this payment', 400);
  }
  if (!Razorpay.verifyCheckoutSignature(details.razorpay_order_id, details.razorpay_payment_id, details.razorpay_signature)) {
    throw fail('Invalid Razorpay payment signature', 400);
  }
  const [gatewayPayment, order] = await Promise.all([
    Razorpay.fetchPayment(details.razorpay_payment_id),
    Razorpay.fetchOrder(details.razorpay_order_id),
  ]);
  if (gatewayPayment.order_id !== payment.gatewayOrderId || Number(gatewayPayment.amount) !== Math.round(Number(payment.amount) * 100) || gatewayPayment.currency !== 'INR') {
    throw fail('Razorpay payment details do not match the invoice payment', 409);
  }
  if (gatewayPayment.status !== 'captured' || order.status !== 'paid') {
    if (['INITIATED', 'PENDING'].includes(payment.status)) await payment.update({ status: 'PENDING', gatewayTransactionId: gatewayPayment.id });
    return { status: 'PENDING', duplicate: false, payment };
  }
  const PaymentService = require('../financial/payment/payment.service');
  const completed = await PaymentService.completePayment(payment.id, {
    status: 'SUCCESS', gatewayTransactionId: gatewayPayment.id,
    gatewaySignature: details.razorpay_signature,
    verificationRemarks: 'Razorpay payment captured and verified',
  });
  return { status: completed.payment.status, duplicate: completed.duplicate, payment: completed.payment };
};

