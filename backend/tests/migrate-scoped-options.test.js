const {
  parseScopedOptions,
  buildScopedPlan,
} = require('../scripts/migrate');

const migration = (name) => ({ name, sql: '', checksum: 'checksum' });

test('scoped migration mode requires an approved target and explicit dry-run or apply', () => {
  expect(parseScopedOptions([
    '--target', '0110_add_billing_penalty_rule_snapshot.sql', '--dry-run',
  ])).toMatchObject({
    target: '0110_add_billing_penalty_rule_snapshot.sql',
    dryRun: true,
    apply: false,
  });

  expect(() => parseScopedOptions([
    '--target', 'sujal/049_link_security_guards_to_staff.sql', '--apply',
  ])).toThrow('not approved');
  expect(() => parseScopedOptions([
    '--target', '0110_add_billing_penalty_rule_snapshot.sql', '--dry-run', '--apply',
  ])).toThrow('Choose exactly one');
});

test('scoped plan selects approved root migrations only through the requested target', () => {
  const migrations = [
    migration('0108_unique_invoice_billing_link.sql'),
    migration('0109_unique_billing_journal_reference.sql'),
    migration('0110_add_billing_penalty_rule_snapshot.sql'),
    migration('0111_add_invoice_previous_balance_sources.sql'),
    migration('sujal/049_link_security_guards_to_staff.sql'),
  ];
  const plan = buildScopedPlan(
    migrations,
    new Set(['0108_unique_invoice_billing_link.sql']),
    '0110_add_billing_penalty_rule_snapshot.sql'
  );
  expect(plan.selected.map(({ name }) => name)).toEqual([
    '0109_unique_billing_journal_reference.sql',
    '0110_add_billing_penalty_rule_snapshot.sql',
  ]);
  expect(plan.notSelected.map(({ name }) => name)).toEqual([
    '0111_add_invoice_previous_balance_sources.sql',
    'sujal/049_link_security_guards_to_staff.sql',
  ]);
});

test('scoped plan refuses to jump over an earlier pending unapproved migration', () => {
  const migrations = [
    migration('0108_previous.sql'),
    migration('sujal/048_pending.sql'),
    migration('0109_unique_billing_journal_reference.sql'),
  ];
  expect(() => buildScopedPlan(migrations, new Set(), '0109_unique_billing_journal_reference.sql'))
    .toThrow('earlier non-approved migrations are pending');
});

test('scoped plan rejects an approved target that is not present in the workspace', () => {
  expect(() => buildScopedPlan([], new Set(), '0111_add_invoice_previous_balance_sources.sql'))
    .toThrow('not present in this workspace');
});
