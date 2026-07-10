import test from 'node:test';
import assert from 'node:assert/strict';
import { searchReturns } from '../src/utils/advancedSearch.js';

test('searchReturns matches amounts and nested values', () => {
  const returns = [
    {
      id: 1,
      client_name: 'Ali Khan',
      cnic_ntn: '12345-6789012-3',
      tax_year: '2024',
      status: 'Pending',
      income_amount: 250000,
      notes: 'Refund request for travel expense',
      wealth_statement: {
        sections: [{ code: 'A1', description: 'Office equipment' }]
      }
    },
    {
      id: 2,
      client_name: 'Sara Ahmed',
      cnic_ntn: '99999-0000000-1',
      tax_year: '2023',
      status: 'Filed',
      income_amount: 500000,
      notes: 'No issues'
    }
  ];

  const byAmount = searchReturns(returns, '250000');
  const byCode = searchReturns(returns, 'A1');
  const byStatus = searchReturns(returns, 'status:pending');

  assert.equal(byAmount.length, 1);
  assert.equal(byAmount[0].id, 1);
  assert.equal(byCode.length, 1);
  assert.equal(byCode[0].id, 1);
  assert.equal(byStatus.length, 1);
  assert.equal(byStatus[0].id, 1);
});
