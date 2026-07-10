import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowSalaryLiabilityDeduction } from '../src/utils/salaryDeductionHelpers.mjs';

test('shows the salary liability deduction row regardless of salary threshold', () => {
  assert.equal(shouldShowSalaryLiabilityDeduction(0), true);
  assert.equal(shouldShowSalaryLiabilityDeduction(600000), true);
  assert.equal(shouldShowSalaryLiabilityDeduction(600001), true);
});
