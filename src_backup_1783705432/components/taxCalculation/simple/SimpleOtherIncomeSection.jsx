import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

const SimpleOtherIncomeSection = ({ data, onUpdate }) => {
  const [showAdditionalReceiptRows, setShowAdditionalReceiptRows] = useState(false);
  const [showDeductionRows, setShowDeductionRows] = useState(false);

  // Receipts sections (5029 sub-items)
  const primaryReceiptHeads = [
    { code: '5028', label: 'Other Receipts' }
  ];

  const additionalReceiptHeads = [
    { code: '5003041', label: 'Yield on Behbood Certificates / Pensioner\'s Benefit Account / Shuhada Family Benefit Account' },
    { code: '5002', label: 'Royalty' },
    { code: '500312', label: 'Profit on Debt' },
    { code: '5016', label: 'Loan, Advance, Deposit or Gift received in Cash' },
    { code: '5004', label: 'Ground Rent' },
    { code: '5005', label: 'Rent from sub lease of Land or Building' },
    { code: '5006', label: 'Rent from lease of Building with Plant and Machinery' },
    { code: '5007', label: 'Annuity / Pension' }
  ];

  const receiptHeads = [...primaryReceiptHeads, ...additionalReceiptHeads];

  // Deductions sections (5089 sub-items)
  const deductionHeads = [
    { code: '5088', label: 'Other Deductions' }
  ];

  const allHeads = [...receiptHeads, ...deductionHeads];

  // Initialize fields if not present
  useEffect(() => {
    let updated = false;
    const newData = { ...data };

    allHeads.forEach(head => {
      if (!newData[head.code]) {
        newData[head.code] = { total: '', exempt: '', normal: '' };
        updated = true;
      }
    });

    if (updated) {
      onUpdate(newData);
    }
  }, [data]);

  const handleChange = (code, field, value) => {
    const headData = data[code] || { total: '', exempt: '', normal: '' };
    onUpdate({
      ...data,
      [code]: {
        ...headData,
        [field]: value
      }
    });
  };

  const getVal = (code, field) => {
    return data[code]?.[field] || '';
  };

  const calculateSum = (heads, field) => {
    return heads.reduce((sum, head) => {
      return sum + (parseFloat(data[head.code]?.[field]) || 0);
    }, 0);
  };

  if (!data.hasIncome) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-sm">Enable this income type to add other source details.</p>
      </div>
    );
  }

  // Calculate sum of receipts (5029)
  const totalReceiptsTotal = calculateSum(receiptHeads, 'total');
  const totalReceiptsExempt = calculateSum(receiptHeads, 'exempt');
  const totalReceiptsNormal = calculateSum(receiptHeads, 'normal');

  // Calculate sum of deductions (5089)
  const totalDeductionsTotal = calculateSum(deductionHeads, 'total');
  const totalDeductionsExempt = calculateSum(deductionHeads, 'exempt');
  const totalDeductionsNormal = calculateSum(deductionHeads, 'normal');

  // Calculate net income (5000) = Receipts - Deductions
  const netOtherTotal = Math.max(0, totalReceiptsTotal - totalDeductionsTotal);
  const netOtherExempt = Math.max(0, totalReceiptsExempt - totalDeductionsExempt);
  const netOtherNormal = Math.max(0, totalReceiptsNormal - totalDeductionsNormal);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
        <table className="w-full text-sm bg-white border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-purple-700 to-purple-600 text-white border-b border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-center font-semibold w-24 text-xs uppercase tracking-wider">Code</th>
              <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Total Amount</th>
              <th className="px-4 py-3 text-right font-semibold w-48 text-xs uppercase tracking-wider">Amount Exempt from Tax / Subject to Fixed / Final Tax</th>
              <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Amount Subject to Normal Tax</th>
            </tr>
          </thead>
          <tbody>
            {/* Income / (Loss) from Other Sources - READ ONLY Header Row (Code 5000) */}
            <tr className="bg-gradient-to-r from-purple-100 to-purple-50 border-b-2 border-purple-200">
              <td className="px-4 py-4 font-bold text-gray-900">
                Income / (Loss) from Other Sources
              </td>
              <td className="px-4 py-4 text-center">
                <span className="inline-block px-3 py-1 bg-purple-600 text-white font-bold rounded-md text-xs shadow-sm">
                  5000
                </span>
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {netOtherTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {netOtherExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {netOtherNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
            </tr>

            {/* Receipts from Other Sources - READ ONLY Section Row (Code 5029) */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <td className="px-4 py-3 font-semibold text-gray-800 pl-6">
                Receipts from Other Sources
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-semibold text-gray-800 text-xs">5029</span>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                Rs. {totalReceiptsTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                Rs. {totalReceiptsExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                Rs. {totalReceiptsNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
            </tr>

            {/* Editable Receipt Rows */}
            {primaryReceiptHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-purple-50 transition-colors">
                <td className="px-4 py-3 text-gray-800 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-xs border border-gray-300">
                    {head.code}
                  </span>
                </td>
                {/* Total */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'total')}
                      onChange={(e) => handleChange(head.code, 'total', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-950 font-semibold transition-all hover:border-purple-400 hover:shadow-sm"
                    />
                  </div>
                </td>
                {/* Exempt */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'exempt')}
                      onChange={(e) => handleChange(head.code, 'exempt', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-950 font-semibold transition-all hover:border-purple-400 hover:shadow-sm"
                    />
                  </div>
                </td>
                {/* Normal */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'normal')}
                      onChange={(e) => handleChange(head.code, 'normal', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-950 font-semibold transition-all hover:border-purple-400 hover:shadow-sm"
                    />
                  </div>
                </td>
              </tr>
            ))}

            <tr className="bg-gray-50 border-b border-gray-300">
              <td colSpan="5" className="px-4 py-2">
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setShowAdditionalReceiptRows(!showAdditionalReceiptRows)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-300 bg-white text-purple-700 transition-all hover:bg-purple-50"
                    aria-label={showAdditionalReceiptRows ? 'Hide additional other source rows' : 'Show additional other source rows'}
                  >
                    <Plus className={`w-4 h-4 transition-transform ${showAdditionalReceiptRows ? 'rotate-45' : ''}`} />
                  </button>
                </div>
              </td>
            </tr>

            {showAdditionalReceiptRows && additionalReceiptHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-purple-50 transition-colors">
                <td className="px-4 py-3 text-gray-800 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-xs border border-gray-300">
                    {head.code}
                  </span>
                </td>
                {/* Total */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'total')}
                      onChange={(e) => handleChange(head.code, 'total', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-950 font-semibold transition-all hover:border-purple-400 hover:shadow-sm"
                    />
                  </div>
                </td>
                {/* Exempt */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'exempt')}
                      onChange={(e) => handleChange(head.code, 'exempt', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-950 font-semibold transition-all hover:border-purple-400 hover:shadow-sm"
                    />
                  </div>
                </td>
                {/* Normal */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'normal')}
                      onChange={(e) => handleChange(head.code, 'normal', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-950 font-semibold transition-all hover:border-purple-400 hover:shadow-sm"
                    />
                  </div>
                </td>
              </tr>
            ))}

            {/* Toggle Deductions Button Row */}
            <tr className="bg-gray-50 border-b border-gray-300">
              <td colSpan="5" className="px-4 py-2">
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setShowDeductionRows(!showDeductionRows)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-300 bg-white text-purple-700 font-medium text-xs transition-all hover:bg-purple-50 shadow-sm"
                  >
                    <Plus className={`w-3.5 h-3.5 transition-transform ${showDeductionRows ? 'rotate-45' : ''}`} />
                    <span>{showDeductionRows ? 'Hide Deductions' : 'Add Deductions (Other Source)'}</span>
                  </button>
                </div>
              </td>
            </tr>

            {/* Deductions from Other Sources - READ ONLY Section Row (Code 5089) */}
            {showDeductionRows && (
              <tr className="bg-gray-100 border-b border-gray-300">
                <td className="px-4 py-3 font-semibold text-gray-800 pl-6">
                  Deductions from Other Sources
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-gray-800 text-xs">5089</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                  Rs. {totalDeductionsTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                  Rs. {totalDeductionsExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                  Rs. {totalDeductionsNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                </td>
              </tr>
            )}

            {/* Editable Deduction Rows */}
            {showDeductionRows && deductionHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-purple-50 transition-colors">
                <td className="px-4 py-3 text-gray-800 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-xs border border-gray-300">
                    {head.code}
                  </span>
                </td>
                {/* Total */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'total')}
                      onChange={(e) => handleChange(head.code, 'total', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-950 font-semibold transition-all hover:border-purple-400 hover:shadow-sm"
                    />
                  </div>
                </td>
                {/* Exempt */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'exempt')}
                      onChange={(e) => handleChange(head.code, 'exempt', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-950 font-semibold transition-all hover:border-purple-400 hover:shadow-sm"
                    />
                  </div>
                </td>
                {/* Normal */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'normal')}
                      onChange={(e) => handleChange(head.code, 'normal', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-950 font-semibold transition-all hover:border-purple-400 hover:shadow-sm"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimpleOtherIncomeSection;
