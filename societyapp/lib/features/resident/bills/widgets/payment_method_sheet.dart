import 'package:flutter/material.dart';

import '../../../auth/data/auth_api.dart';
import '../../../../app/theme/app_colors.dart';
import '../data/resident_bills_api.dart';
import '../data/razorpay_checkout.dart';

class PaymentMethodSheet extends StatefulWidget {
  const PaymentMethodSheet({
    super.key,
    required this.user,
    required this.invoice,
    this.currency = 'INR',
    this.onPaymentCompleted,
  });

  final AuthenticatedUser user;
  final ResidentInvoice invoice;
  final String currency;
  final VoidCallback? onPaymentCompleted;

  static Future<void> show(
    BuildContext context, {
    required AuthenticatedUser user,
    required ResidentInvoice invoice,
    String currency = 'INR',
    VoidCallback? onPaymentCompleted,
  }) =>
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => PaymentMethodSheet(
          user: user,
          invoice: invoice,
          currency: currency,
          onPaymentCompleted: onPaymentCompleted,
        ),
      );

  @override
  State<PaymentMethodSheet> createState() => _PaymentMethodSheetState();
}

class _PaymentMethodSheetState extends State<PaymentMethodSheet> {
  final RazorpayCheckout _razorpay = RazorpayCheckout();
  String _selectedMethod = 'UPI';
  bool _submitting = false;
  String? _error;
  ResidentPaymentResult? _initiatedPayment;
  bool _isCashRequestRecorded = false;

  String get _currencySymbol => switch (widget.currency.toUpperCase()) {
        'INR' => String.fromCharCode(0x20B9),
        'USD' => r'$',
        'EUR' => String.fromCharCode(0x20AC),
        'GBP' => String.fromCharCode(0x00A3),
        _ => widget.currency,
      };

  String get _amountFormatted =>
      '$_currencySymbol ${widget.invoice.outstandingAmount.toStringAsFixed(2).replaceFirst(RegExp(r'\.00$'), '')}';

  // Handle proceed for both cash and online methods
  Future<void> _handleProceed() async {
    setState(() {
      _submitting = true;
      _error = null;
    });

    if (_selectedMethod == 'CASH') {
      // Existing cash flow: initiate and stay in sheet
      try {
        final result = await ResidentBillsApi.initiatePayment(
          token: widget.user.accessToken,
          invoiceId: widget.invoice.id,
          paymentMethod: _selectedMethod,
        );
        if (!mounted) return;
        setState(() {
          _submitting = false;
          _isCashRequestRecorded = true;
          _initiatedPayment = result;
        });
        widget.onPaymentCompleted?.call();
      } on ResidentBillsException catch (e) {
        if (mounted) setState(() => _error = e.message);
      } finally {
        if (mounted) setState(() => _submitting = false);
      }
    } else {
      try {
        final attempt = await ResidentBillsApi.initiatePayment(
          token: widget.user.accessToken,
          invoiceId: widget.invoice.id,
          paymentMethod: _selectedMethod,
        );
        widget.onPaymentCompleted?.call();
        if (attempt.checkoutKeyId == null || attempt.gatewayOrderId == null || attempt.checkoutAmount == null) {
          throw const ResidentBillsException('Razorpay checkout details are unavailable.');
        }
        final result = await _razorpay.open({
          'key': attempt.checkoutKeyId!,
          'order_id': attempt.gatewayOrderId!,
          'amount': attempt.checkoutAmount!,
          'currency': attempt.checkoutCurrency ?? 'INR',
          'name': 'Housing Society',
          'description': widget.invoice.invoiceNumber,
          'prefill': {'name': widget.user.name, 'email': widget.user.email, if (widget.user.phone != null) 'contact': widget.user.phone},
          'notes': {'payment_reference': attempt.paymentReference},
          'theme': {'color': '#3949AB'},
        });
        if (!mounted) return;
        if (result == null) {
          widget.onPaymentCompleted?.call();
          setState(() => _error = 'Payment was not completed. You can check its status in Payment History.');
          return;
        }
        final verified = await ResidentBillsApi.verifyRazorpayPayment(
          token: widget.user.accessToken,
          paymentId: attempt.paymentId,
          razorpayPaymentId: result['razorpay_payment_id']!,
          razorpayOrderId: result['razorpay_order_id']!,
          razorpaySignature: result['razorpay_signature']!,
        );
        if (!mounted) return;
        widget.onPaymentCompleted?.call();
        if (verified.isSuccess) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment successful')));
        } else {
          setState(() => _error = 'Payment status: ${verified.status}. You can check Payment History for updates.');
        }
      } on ResidentBillsException catch (error) {
        if (mounted) setState(() => _error = error.message);
      } catch (_) {
        if (mounted) setState(() => _error = 'Checkout could not be completed. Check Payment History before retrying.');
      } finally {
        if (mounted) setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        14,
        20,
        24 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD9DEEA),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              if (_isCashRequestRecorded)
                _successView()
              else if (_initiatedPayment != null)
                _pendingOnlineView()
              else
                _selectMethodView(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _selectMethodView() => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Select Payment Method',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      widget.invoice.description ??
                          (widget.invoice.billingPeriod.isNotEmpty
                              ? widget.invoice.billingPeriod
                              : widget.invoice.invoiceNumber),
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF7F8A9D),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F1FF),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  _amountFormatted,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.indigo,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'CHOOSE PAYMENT OPTION',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.1,
              color: AppColors.muted,
            ),
          ),
          const SizedBox(height: 10),
          RadioGroup<String>(
            groupValue: _selectedMethod,
            onChanged: (value) {
              if (value == null) return;
              setState(() {
                _selectedMethod = value;
                _error = null;
              });
            },
            child: Column(
              children: [
                _methodTile(
                  methodKey: 'UPI',
                  title: 'UPI',
                  subtitle: 'UPI payment request',
                  icon: Icons.qr_code_2_rounded,
                  iconColor: const Color(0xFF6255E8),
                  iconBg: const Color(0xFFECE9FF),
                  badge: 'Available',
                ),
                const SizedBox(height: 8),
                _methodTile(
                  methodKey: 'GOOGLE_PAY',
                  title: 'Google Pay',
                  subtitle: 'Google Pay payment request',
                  icon: Icons.account_balance_wallet_rounded,
                  iconColor: const Color(0xFF4285F4),
                  iconBg: const Color(0xFFE8F1FF),
                ),
                const SizedBox(height: 8),
                _methodTile(
                  methodKey: 'PHONEPE',
                  title: 'PhonePe',
                  subtitle: 'PhonePe payment request',
                  icon: Icons.electric_bolt_rounded,
                  iconColor: const Color(0xFF5F259F),
                  iconBg: const Color(0xFFF2E9FF),
                ),
                const SizedBox(height: 8),
                _methodTile(
                  methodKey: 'RUPAY_CARD',
                  title: 'RuPay / Card',
                  subtitle: 'Card payment request',
                  icon: Icons.credit_card_rounded,
                  iconColor: const Color(0xFF168B68),
                  iconBg: const Color(0xFFE4F7F1),
                ),
                const SizedBox(height: 8),
                _methodTile(
                  methodKey: 'CASH',
                  title: 'Cash (Society Office)',
                  subtitle: 'Requires collection and admin verification',
                  icon: Icons.payments_outlined,
                  iconColor: const Color(0xFFD1802E),
                  iconBg: const Color(0xFFFFF4E7),
                  badge: 'Offline',
                ),
              ],
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF0F0),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFFD0D0)),
              ),
              child: Text(
                _error!,
                style: const TextStyle(color: Color(0xFF9D2635), fontSize: 12),
              ),
            ),
          ],
          const SizedBox(height: 22),
          SizedBox(
            height: 52,
            child: FilledButton(
              onPressed: _submitting ? null : _handleProceed,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.indigo,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
              ),
              child: _submitting
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Proceed to Pay',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _submitting ? null : () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
        ],
      );

  Widget _methodTile({
    required String methodKey,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    String? badge,
  }) {
    final selected = _selectedMethod == methodKey;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: _submitting ? null : () => setState(() {
          _selectedMethod = methodKey;
          _error = null;
        }),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: selected ? const Color(0xFFF4F2FF) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? AppColors.indigo : const Color(0xFFEBEFF5),
              width: selected ? 1.6 : 1.0,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: selected ? FontWeight.w800 : FontWeight.w700,
                              color: AppColors.ink,
                            ),
                          ),
                        ),
                        if (badge != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: badge == 'Fastest' ? const Color(0xFFE4F7F1) : const Color(0xFFFFF3E9),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              badge,
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: badge == 'Fastest' ? const Color(0xFF229B78) : const Color(0xFFD1802E),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFF8994A7),
                      ),
                    ),
                  ],
                ),
              ),
              Radio<String>(value: methodKey, groupValue: _selectedMethod, onChanged: _submitting ? null : (v) => setState(() => _selectedMethod = methodKey), activeColor: AppColors.indigo),
            ],
          ),
        ),
      ),
    );
  }

  Widget _pendingOnlineView() {
    final payment = _initiatedPayment!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          width: 54,
          height: 54,
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFECE9FF),
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Icon(
            Icons.lock_clock_rounded,
            color: AppColors.indigo,
            size: 28,
          ),
        ),
        const Text(
          'Payment request recorded',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Selected method: ${_methodLabel(_selectedMethod)}',
          style: const TextStyle(fontSize: 13, color: Color(0xFF7F8A9D)),
        ),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF7F8FC),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFEBEFF5)),
          ),
          child: Column(
            children: [
              _summaryRow('Amount to Pay', _amountFormatted, isBold: true),
              const Divider(height: 16, color: Color(0xFFE8ECF3)),
              _summaryRow('Reference ID', payment.paymentReference),
              if (payment.gatewayOrderId != null) ...[
                const Divider(height: 16, color: Color(0xFFE8ECF3)),
                _summaryRow('Order ID', payment.gatewayOrderId!),
              ],
              const Divider(height: 16, color: Color(0xFFE8ECF3)),
              _summaryRow(
                'Bill',
                widget.invoice.billingPeriod.isNotEmpty
                    ? widget.invoice.billingPeriod
                    : widget.invoice.invoiceNumber,
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFE8F1FF),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Icon(
                Icons.info_outline_rounded,
                color: Color(0xFF3872C4),
                size: 18,
              ),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'This transaction is pending. It will be marked paid only after the payment provider confirms it.',
                  style: TextStyle(
                    fontSize: 11,
                    color: Color(0xFF285494),
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        SizedBox(
          height: 52,
          child: FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF168B68),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
            ),
            child: const Text(
              'Done',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ],
    );
  }

  Widget _successView() {
    final payment = _initiatedPayment!;
    final isCash = _selectedMethod == 'CASH';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 8),
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: isCash ? const Color(0xFFFFF4E7) : const Color(0xFFE4F7F1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isCash ? Icons.schedule_rounded : Icons.check_circle_rounded,
            color: isCash ? const Color(0xFFD1802E) : const Color(0xFF229B78),
            size: 38,
          ),
        ),
        const SizedBox(height: 18),
        Text(
          isCash ? 'Cash Payment Request Recorded' : 'Payment Successful!',
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 21,
            fontWeight: FontWeight.w800,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          isCash
              ? 'Please submit the cash amount of $_amountFormatted at the society management office. An authorized admin will verify and issue your receipt.'
              : 'Your payment of $_amountFormatted has been confirmed and your maintenance bill has been marked as paid.',
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 13,
            color: Color(0xFF59657A),
            height: 1.5,
          ),
        ),
        const SizedBox(height: 20),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF7F8FC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFEBEFF5)),
          ),
          child: Column(
            children: [
              _summaryRow('Reference ID', payment.paymentReference),
              if (payment.receiptNumber != null) ...[
                const Divider(height: 14, color: Color(0xFFE8ECF3)),
                _summaryRow(
                  'Receipt Number',
                  payment.receiptNumber!,
                  isBold: true,
                ),
              ],
              const Divider(height: 14, color: Color(0xFFE8ECF3)),
              _summaryRow('Status', isCash ? 'PENDING VERIFICATION' : 'PAID'),
            ],
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.indigo,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
            ),
            child: const Text(
              'Done',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ],
    );
  }

  Widget _summaryRow(String label, String value, {bool isBold = false}) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Color(0xFF7F8A9D)),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isBold ? FontWeight.w800 : FontWeight.w700,
              color: isBold ? AppColors.indigo : AppColors.ink,
            ),
          ),
        ],
      );

  String _methodLabel(String method) => switch (method.toUpperCase()) {
        'GOOGLE_PAY' => 'Google Pay',
        'PHONEPE' => 'PhonePe',
        'UPI' => 'UPI',
        'RUPAY_CARD' => 'RuPay / Card',
        'CASH' => 'Cash',
        _ => method,
      };

  @override
  void dispose() {
    _razorpay.dispose();
    super.dispose();
  }
}
