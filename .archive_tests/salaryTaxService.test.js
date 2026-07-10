const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateSalaryTaxFromSlabs, shouldShowSalaryLiabilityDeduction, SALARY_LIABILITY_THRESHOLD, validateTaxableIncome, getEffectiveTaxableIncome } = require('../api/salaryTaxService');

test('calculates tax using the correct slab and fixed tax', () => {
  const slabs = [
    { income_from: 0, income_to: 600000, fixed_tax: 0, rate_percent: 0 },
    { income_from: 600001, income_to: 1200000, fixed_tax: 0, rate_percent: 1 },
    { income_from: 1200001, income_to: 2200000, fixed_tax: 6000, rate_percent: 11 }
  ];

  const result = calculateSalaryTaxFromSlabs(1500000, slabs);

  assert.equal(result.success, true);
  assert.equal(result.slab.income_from, 1200001);
  assert.equal(result.totalTax, 45000);
  assert.equal(result.breakdown.excessIncome, 299999);
});

test('returns a no-slab result when no matching slab exists', () => {
  const result = calculateSalaryTaxFromSlabs(100, []);

  assert.equal(result.success, false);
  assert.equal(result.error, 'No active salary tax slabs available');
});

test('shows salary liability deduction once salary exceeds 6 lakh', () => {
  assert.equal(shouldShowSalaryLiabilityDeduction(600000), false);
  assert.equal(shouldShowSalaryLiabilityDeduction(600001), true);
  assert.equal(shouldShowSalaryLiabilityDeduction(1000000), true);
  assert.equal(SALARY_LIABILITY_THRESHOLD, 600000);
});

test('applies progressive slab calculations and validates income input', () => {
  const slabs = [
    { income_from: 0, income_to: 600000, fixed_tax: 0, rate_percent: 0 },
    { income_from: 600001, income_to: 1200000, fixed_tax: 0, rate_percent: 1 },
    { income_from: 1200001, income_to: 2200000, fixed_tax: 6000, rate_percent: 11 }
  ];

  const result = calculateSalaryTaxFromSlabs(1500000, slabs);

  assert.equal(result.success, true);
  assert.equal(result.totalTax, 45000);
  assert.equal(result.breakdown.slabs.length, 3);
  assert.equal(validateTaxableIncome(1000000001).success, false);
});

test('reduces taxable income once the liability deduction is applied', () => {
  assert.equal(getEffectiveTaxableIncome(1000000, 200000), 800000);
  assert.equal(getEffectiveTaxableIncome(1000000, 2000000), 0);
  assert.equal(getEffectiveTaxableIncome(0, 100), 0);
});
