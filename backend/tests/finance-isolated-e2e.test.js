const { randomUUID } = require('node:crypto');
require('dotenv').config({ path: require('node:path').resolve(__dirname, '..', '.env') });

jest.setTimeout(20000);

const sequelize = require('../src/config/database');
// Register model associations used by the same Admin invoice service as the API.
require('../src/config/models');
const invoiceService = require('../src/modules/financial/invoice/invoice.service');

const insert = (sql, replacements) => sequelize.query(sql, { replacements });

test('isolated Admin invoice read reflects live synthetic source balances without changing payable totals', async () => {
  const ids = {
    society: randomUUID(), tower: randomUUID(), floor: randomUUID(), unit: randomUUID(),
    otherSociety: randomUUID(), otherTower: randomUUID(), otherFloor: randomUUID(), otherUnit: randomUUID(),
    user: randomUUID(), resident: randomUUID(), ownerUnit: randomUUID(),
    source: randomUUID(), samePeriodSource: randomUUID(), foreignSource: randomUUID(), statement: randomUUID(),
  };
  const invoiceIds = [ids.source, ids.samePeriodSource, ids.foreignSource, ids.statement];
  let seeded = false;

  const clean = async () => {
    if (!seeded) return;
    await insert(
      `DELETE FROM invoice_previous_balance_sources
        WHERE statement_invoice_id = :statement
           OR source_invoice_id IN (:source, :samePeriodSource, :foreignSource, :statement)`,
      { statement: ids.statement, source: ids.source, samePeriodSource: ids.samePeriodSource, foreignSource: ids.foreignSource }
    );
    await insert('DELETE FROM invoices WHERE id IN (:source, :samePeriodSource, :foreignSource, :statement)', {
      source: ids.source, samePeriodSource: ids.samePeriodSource, foreignSource: ids.foreignSource, statement: ids.statement,
    });
    await insert('DELETE FROM owner_units WHERE id = :id', { id: ids.ownerUnit });
    await insert('DELETE FROM residents WHERE id = :id', { id: ids.resident });
    await insert('DELETE FROM users WHERE id = :id', { id: ids.user });
    await insert('DELETE FROM units WHERE id IN (:unit, :otherUnit)', { unit: ids.unit, otherUnit: ids.otherUnit });
    await insert('DELETE FROM floors WHERE id IN (:floor, :otherFloor)', { floor: ids.floor, otherFloor: ids.otherFloor });
    await insert('DELETE FROM towers WHERE id IN (:tower, :otherTower)', { tower: ids.tower, otherTower: ids.otherTower });
    await insert('DELETE FROM societies WHERE id IN (:society, :otherSociety)', { society: ids.society, otherSociety: ids.otherSociety });
  };

  try {
    const [identity] = await sequelize.query('SELECT current_database() AS database_name, current_user AS role');
    expect(identity[0].database_name).toBe('housing_society_e2e_test');

    seeded = true;
    const now = new Date();
    const created = now.toISOString();
    await insert(
      `INSERT INTO societies (id, name, address, created_at, updated_at)
       VALUES (:id, 'Synthetic E2E Society', 'Synthetic test address', :created, :created)`,
      { id: ids.society, created }
    );
    await insert(
      `INSERT INTO societies (id, name, address, created_at, updated_at)
       VALUES (:id, 'Synthetic E2E Other Society', 'Synthetic test address', :created, :created)`,
      { id: ids.otherSociety, created }
    );
    await insert(
      `INSERT INTO towers (id, society_id, name, floor_count, created_at, updated_at)
       VALUES (:id, :society, 'E2E Tower', 1, :created, :created),
              (:otherTower, :otherSociety, 'Other E2E Tower', 1, :created, :created)`,
      { id: ids.tower, society: ids.society, otherTower: ids.otherTower, otherSociety: ids.otherSociety, created }
    );
    await insert(
      `INSERT INTO floors (id, tower_id, floor_number, created_at, updated_at)
       VALUES (:id, :tower, 1, :created, :created), (:otherFloor, :otherTower, 1, :created, :created)`,
      { id: ids.floor, tower: ids.tower, otherFloor: ids.otherFloor, otherTower: ids.otherTower, created }
    );
    await insert(
      `INSERT INTO units (id, society_id, floor_id, unit_number, created_at, updated_at)
       VALUES (:id, :society, :floor, 'E2E-101', :created, :created),
              (:otherUnit, :otherSociety, :otherFloor, 'E2E-201', :created, :created)`,
      { id: ids.unit, society: ids.society, floor: ids.floor, otherUnit: ids.otherUnit, otherSociety: ids.otherSociety, otherFloor: ids.otherFloor, created }
    );
    await insert(
      `INSERT INTO users (id, society_id, email, password_hash, first_name, last_name, created_at, updated_at)
       VALUES (:id, :society, :email, 'synthetic-test-only', 'Finance', 'Resident', :created, :created)`,
      { id: ids.user, society: ids.society, email: `synthetic-${ids.user}@example.invalid`, created }
    );
    await insert(
      `INSERT INTO residents (id, society_id, first_name, last_name, mobile, role, status, user_id, created_at, updated_at)
       VALUES (:id, :society, 'Finance', 'Resident', '0000000000', 'PRIMARY_OWNER', 'ACTIVE', :user, :created, :created)`,
      { id: ids.resident, society: ids.society, user: ids.user, created }
    );
    await insert(
      `INSERT INTO owner_units (id, society_id, owner_id, unit_id, ownership_type, effective_from, status, created_at, updated_at)
       VALUES (:id, :society, :resident, :unit, 'PRIMARY_OWNER', '2026-01-01', 'ACTIVE', :created, :created)`,
      { id: ids.ownerUnit, society: ids.society, resident: ids.resident, unit: ids.unit, created }
    );
    const addInvoice = (id, society, unit, number, period, total, outstanding, status) => insert(
      `INSERT INTO invoices (
        id, society_id, unit_id, invoice_number, billing_period, invoice_date, due_date,
        subtotal, total_amount, paid_amount, outstanding_amount, status, idempotency_key,
        created_at, updated_at
      ) VALUES (
        :id, :society, :unit, :number, :period, '2026-10-01', '2026-10-10',
        :total, :total, :paid, :outstanding, :status, :key, :created, :created
      )`,
      { id, society, unit, number, period, total, paid: Number(total) - Number(outstanding), outstanding, status, key: `synthetic-e2e:${id}`, created }
    );

    await addInvoice(ids.source, ids.society, ids.unit, `E2E-OLD-${ids.source}`, 'October 2026', 1000, 1000, 'ISSUED');
    await addInvoice(ids.samePeriodSource, ids.society, ids.unit, `E2E-CURRENT-${ids.samePeriodSource}`, 'November 2026', 500, 500, 'ISSUED');
    await addInvoice(ids.foreignSource, ids.otherSociety, ids.otherUnit, `E2E-FOREIGN-${ids.foreignSource}`, 'October 2026', 700, 700, 'ISSUED');
    await addInvoice(ids.statement, ids.society, ids.unit, `E2E-STATEMENT-${ids.statement}`, 'November 2026', 100, 100, 'ISSUED');
    await insert(
      `INSERT INTO invoice_previous_balance_sources (statement_invoice_id, source_invoice_id, amount_at_statement)
       VALUES (:statement, :source, 1000), (:statement, :samePeriod, 500), (:statement, :foreignSource, 700)`,
      { statement: ids.statement, source: ids.source, samePeriod: ids.samePeriodSource, foreignSource: ids.foreignSource }
    );

    const first = (await invoiceService.getAll({ societyId: ids.society, unitId: ids.unit }))
      .find((invoice) => invoice.id === ids.statement);
    expect(first).toMatchObject({ previousBalance: 1000, totalAmount: '100.00', outstandingAmount: '100.00' });
    expect(first.previousBalanceSources).toHaveLength(1);
    const residentBillsService = require('../src/modules/resident-bills/resident-bills.service');
    const residentFirst = await residentBillsService.getOutstandingDues({ societyId: ids.society, id: ids.user });
    const residentStatementFirst = residentFirst.dues.find((invoice) => invoice.id === ids.statement);
    expect(residentStatementFirst.previousBalance).toBe(1000);
    expect(residentFirst.totalOutstanding).toBe(1600);
    expect(residentFirst.totalOutstanding).toBe(residentFirst.dues.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0));

    await insert(
      `UPDATE invoices SET outstanding_amount = 600, paid_amount = 400,
         status = 'PARTIALLY_PAID', updated_at = now() WHERE id = :source`,
      { source: ids.source }
    );
    const afterSyntheticBalanceUpdate = (await invoiceService.getAll({ societyId: ids.society, unitId: ids.unit }))
      .find((invoice) => invoice.id === ids.statement);
    expect(afterSyntheticBalanceUpdate).toMatchObject({ previousBalance: 600, totalAmount: '100.00', outstandingAmount: '100.00' });
    expect(afterSyntheticBalanceUpdate.previousBalanceSources[0]).toMatchObject({
      invoiceId: ids.source,
      amountAtStatement: 1000,
      outstandingAmount: 600,
    });
    const residentAfterUpdate = await residentBillsService.getOutstandingDues({ societyId: ids.society, id: ids.user });
    const residentStatementAfterUpdate = residentAfterUpdate.dues.find((invoice) => invoice.id === ids.statement);
    expect(residentStatementAfterUpdate.previousBalance).toBe(600);
    expect(residentAfterUpdate.totalOutstanding).toBe(1200);
    expect(residentAfterUpdate.totalOutstanding)
      .toBe(residentAfterUpdate.dues.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0));
  } finally {
    await clean();
  }
});
