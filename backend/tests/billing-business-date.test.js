const { getSocietyBusinessDate } = require('../src/modules/financial/billing/businessDate');

test.each([
  ['2026-11-15T18:29:59.000Z', '2026-11-15'],
  ['2026-11-15T18:30:00.000Z', '2026-11-16'],
  ['2026-11-16T00:00:00.000Z', '2026-11-16'],
])('uses the society business date at UTC instant %s', (instant, expected) => {
  expect(getSocietyBusinessDate(new Date(instant))).toBe(expected);
});
