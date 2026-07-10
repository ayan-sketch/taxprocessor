import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

const SimplePropertyIncomeSection = ({ data, onUpdate }) => {
  const [showAdditionalPropertyRows, setShowAdditionalPropertyRows] = useState(false);
  const [showAdditionalDeductions, setShowAdditionalDeductions] = useState(false);
  const [activeView, setActiveView] = useState('property');
  const [is2037Overridden, setIs2037Overridden] = useState(false);

  // Receipts sections (2029 sub-items)
  const primaryReceiptHeads = [
    { code: '2001', label: 'Rent Received or Receivable' }
  ];

  const additionalReceiptHeads = [
    { code: '2002', label: '1/10th of Amount not Adjustable against Rent' },
    { code: '2003', label: 'Forfeited Deposit under a Contract for Sale of Property' },
    { code: '2004', label: 'Recovery of Unpaid Irrecoverable Rent allowed as deduction' },
    { code: '2005', label: 'Unpaid Liabilities exceeding three Years' }
  ];

  const receiptHeads = [...primaryReceiptHeads, ...additionalReceiptHeads];

  // Primary deduction fields (always visible)
  const primaryDeductionHeads = [
    { code: '2031', label: '1/5th of Rent of Building for Repairs', autoCalculate: true, percentage: 20 },
    { code: '2037', label: 'Rent Collection Expenditure', autoCalculate: true, percentage: 4 }
  ];

  // Additional deduction fields (hidden by default)
  const additionalDeductionHeads = [
    { code: '2032', label: 'Insurance Premium' },
    { code: '2033', label: 'Local Rate / Tax / Charge / Cess' },
    { code: '2034', label: 'Ground Rent' },
    { code: '2035', label: 'Profit on Capital borrowed for Investment in Property' },
    { code: '2036', label: 'Share in Rental Income Paid to HBFC / Banks' },
    { code: '2038', label: 'Legal Service Charges' },
    { code: '2039', label: 'Amount claimed as Irrecoverable Rent' },
    { code: '2097', label: 'Payment of Liabilities treated as Income' },
    { code: '2098', label: 'Other Deductions against Rent' }
  ];

  const deductionHeads = [...primaryDeductionHeads, ...additionalDeductionHeads];
  const extraDeductionHeads = [
    { code: '64080001', label: 'Rent of Immoveable Property u/s 155' }
  ];
  const allHeads = [...receiptHeads, ...deductionHeads];

  // Initialize fields if not present
  useEffect(() => {
    let updated = false;
    const newData = { ...data };

    [...primaryReceiptHeads, ...additionalReceiptHeads, ...deductionHeads].forEach(head => {
      if (!newData[head.code]) {
        newData[head.code] = { total: '', exempt: '', normal: '' };
        updated = true;
      }
    });

    extraDeductionHeads.forEach(head => {
      if (!newData[head.code]) {
        newData[head.code] = { amount: '' };
        updated = true;
      }
    });

    if (updated) {
      onUpdate(newData);
    }
  }, [data]);

  // Auto-calculate deductions based on total receipts
  useEffect(() => {
    // Calculate total receipts from property (2029)
    const totalReceiptsTotal = calculateSum(receiptHeads, 'total');
    const totalReceiptsExempt = calculateSum(receiptHeads, 'exempt');
    const totalReceiptsNormal = calculateSum(receiptHeads, 'normal');

    let updated = false;
    const newData = { ...data };

    // Auto-calculate 2031 (20% of total receipts)
    const calculated2031Total = Math.round(totalReceiptsTotal * 0.20);
    const calculated2031Exempt = Math.round(totalReceiptsExempt * 0.20);
    const calculated2031Normal = Math.round(totalReceiptsNormal * 0.20);

    if (data['2031']?.total !== calculated2031Total.toString()) {
      newData['2031'] = {
        total: calculated2031Total.toString(),
        exempt: calculated2031Exempt.toString(),
        normal: calculated2031Normal.toString()
      };
      updated = true;
    }

    // Auto-calculate 2037 (4% of total receipts) only if not manually overridden
    if (!is2037Overridden) {
      const calculated2037Total = Math.round(totalReceiptsTotal * 0.04);
      const calculated2037Exempt = Math.round(totalReceiptsExempt * 0.04);
      const calculated2037Normal = Math.round(totalReceiptsNormal * 0.04);

      if (data['2037']?.total !== calculated2037Total.toString()) {
        newData['2037'] = {
          total: calculated2037Total.toString(),
          exempt: calculated2037Exempt.toString(),
          normal: calculated2037Normal.toString()
        };
        updated = true;
      }
    } else {
      // If overridden, enforce the 4% cap on the existing values
      const current2037Total = parseFloat(data['2037']?.total) || 0;
      const current2037Exempt = parseFloat(data['2037']?.exempt) || 0;
      const current2037Normal = parseFloat(data['2037']?.normal) || 0;

      const maxTotal = Math.round(totalReceiptsTotal * 0.04);
      const maxExempt = Math.round(totalReceiptsExempt * 0.04);
      const maxNormal = Math.round(totalReceiptsNormal * 0.04);

      const cappedTotal = Math.min(current2037Total, maxTotal);
      const cappedExempt = Math.min(current2037Exempt, maxExempt);
      const cappedNormal = Math.min(current2037Normal, maxNormal);

      if (current2037Total !== cappedTotal || current2037Exempt !== cappedExempt || current2037Normal !== cappedNormal) {
        newData['2037'] = {
          total: cappedTotal.toString(),
          exempt: cappedExempt.toString(),
          normal: cappedNormal.toString()
        };
        updated = true;
      }
    }

    // If all receipts are empty/zero, force 2037 to be empty
    if (totalReceiptsTotal <= 0 && totalReceiptsExempt <= 0 && totalReceiptsNormal <= 0) {
      if (data['2037']?.total !== '' || data['2037']?.exempt !== '' || data['2037']?.normal !== '') {
        newData['2037'] = {
          total: '',
          exempt: '',
          normal: ''
        };
        setIs2037Overridden(false);
        updated = true;
      }
    }

    if (updated) {
      onUpdate(newData);
    }
  }, [data, receiptHeads.map(h => data[h.code]?.total).join(',')]);

  const handleChange = (code, field, value) => {
    // Don't allow manual editing of other auto-calculated fields except 2037
    const deductionHead = deductionHeads.find(h => h.code === code);
    if (deductionHead && deductionHead.autoCalculate && code !== '2037') {
      return; // Prevent editing other auto-calculated fields
    }

    // For 2037: cap the value at 4% of corresponding receipt field, clear if receipts are empty
    if (code === '2037') {
      const totalReceiptsForField = receiptHeads.reduce((sum, head) => {
        return sum + (parseFloat(data[head.code]?.[field]) || 0);
      }, 0);

      // If receipts are empty/zero, force 2037 to empty
      if (totalReceiptsForField <= 0) {
        const headData = data[code] || { total: '', exempt: '', normal: '' };
        onUpdate({
          ...data,
          [code]: {
            ...headData,
            [field]: ''
          }
        });
        return;
      }

      const maxAllowed = Math.round(totalReceiptsForField * 0.04);
      const enteredValue = parseFloat(value) || 0;

      // Cap at 4% — user can enter below but not above
      if (enteredValue > maxAllowed) {
        value = maxAllowed.toString();
      }

      setIs2037Overridden(true);
    }

    const headData = data[code] || { total: '', exempt: '', normal: '' };
    onUpdate({
      ...data,
      [code]: {
        ...headData,
        [field]: value
      }
    });
  };

  const handleExtraDeductionChange = (code, value) => {
    const headData = data[code] || { amount: '' };
    onUpdate({
      ...data,
      [code]: {
        ...headData,
        amount: value
      }
    });
  };

  const getVal = (code, field) => {
    return data[code]?.[field] || '';
  };

  const getExtraDeductionValue = (code) => {
    return data[code]?.amount || '';
  };

  const calculateSum = (heads, field) => {
    return heads.reduce((sum, head) => {
      return sum + (parseFloat(data[head.code]?.[field]) || 0);
    }, 0);
  };

  if (!data.hasIncome) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-sm">Enable this income type to add property details.</p>
      </div>
    );
  }

  // Calculate sum of receipts (2029)
  const totalReceiptsTotal = calculateSum(receiptHeads, 'total');
  const totalReceiptsExempt = calculateSum(receiptHeads, 'exempt');
  const totalReceiptsNormal = calculateSum(receiptHeads, 'normal');

  // Calculate sum of deductions (2099)
  const totalDeductionsTotal = calculateSum(deductionHeads, 'total');
  const totalDeductionsExempt = calculateSum(deductionHeads, 'exempt');
  const totalDeductionsNormal = calculateSum(deductionHeads, 'normal');

  // Calculate net income (2000) = Receipts - Deductions
  const netPropertyTotal = Math.max(0, totalReceiptsTotal - totalDeductionsTotal);
  const netPropertyExempt = Math.max(0, totalReceiptsExempt - totalDeductionsExempt);
  const netPropertyNormal = Math.max(0, totalReceiptsNormal - totalDeductionsNormal);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveView('property')}
          className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
            activeView === 'property'
              ? 'border-amber-600 bg-amber-600 text-white'
              : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
          }`}
        >
          Property
        </button>
        <button
          type="button"
          onClick={() => setActiveView('deduction')}
          className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
            activeView === 'deduction'
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
          }`}
        >
          Deduction
        </button>
      </div>

      {activeView === 'property' ? (
        <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
        <table className="w-full text-sm bg-white border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white border-b border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-center font-semibold w-24 text-xs uppercase tracking-wider">Code</th>
              <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Total Amount</th>
              <th className="px-4 py-3 text-right font-semibold w-48 text-xs uppercase tracking-wider">Amount Exempt from Tax / Subject to Fixed / Final Tax</th>
              <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Amount Subject to Normal Tax</th>
            </tr>
          </thead>
          <tbody>
            {/* Income / (Loss) from Property - READ ONLY Header Row (Code 2000) */}
            <tr className="bg-amber-100 border-b-2 border-amber-200">
              <td className="px-4 py-4 font-bold text-gray-900">
                Income / (Loss) from Property
              </td>
              <td className="px-4 py-4 text-center">
                <span className="inline-block px-3 py-1 bg-amber-200 text-amber-900 font-bold rounded text-xs">
                  2000
                </span>
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {netPropertyTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {netPropertyExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900 text-amber-900">
                Rs. {netPropertyNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
            </tr>

            {/* Total Receipts from Property - READ ONLY Section Row (Code 2029) */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <td className="px-4 py-3 font-semibold text-gray-800 pl-6">
                Total Receipts from Property
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-semibold text-gray-800 text-xs">2029</span>
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
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-55 text-gray-600 font-semibold rounded text-xs border border-gray-200">
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
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
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
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
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
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>
              </tr>
            ))}

            <tr className="bg-gray-50 border-b border-gray-300">
              <td colSpan="5" className="px-4 py-2">
                <div className="flex justify-start">
                  <button
                    onClick={() => setShowAdditionalPropertyRows(!showAdditionalPropertyRows)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-white text-amber-700 transition-all hover:bg-amber-50"
                    aria-label={showAdditionalPropertyRows ? 'Hide extra property income rows' : 'Show extra property income rows'}
                  >
                    <Plus className={`w-4 h-4 transition-transform ${showAdditionalPropertyRows ? 'rotate-45' : ''}`} />
                  </button>
                </div>
              </td>
            </tr>

            {showAdditionalPropertyRows && additionalReceiptHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-55 text-gray-600 font-semibold rounded text-xs border border-gray-200">
                    {head.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'total')}
                      onChange={(e) => handleChange(head.code, 'total', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'exempt')}
                      onChange={(e) => handleChange(head.code, 'exempt', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'normal')}
                      onChange={(e) => handleChange(head.code, 'normal', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>
              </tr>
            ))}

            {/* Total Deductions from Property - READ ONLY Section Row (Code 2099) */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <td className="px-4 py-3 font-semibold text-gray-800 pl-6">
                Total Deductions from Property
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-semibold text-gray-800 text-xs">2099</span>
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

            {/* Editable Primary Deduction Rows (Always Visible) */}
            {primaryDeductionHeads.map((head) => {
              const isAutoCalculated = head.autoCalculate;
              const isEditable2037 = head.code === '2037';
              const isDisabled = isAutoCalculated && !isEditable2037;
              return (
                <tr key={head.code} className={`border-b border-gray-200 ${isAutoCalculated ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}>
                  <td className="px-4 py-3 text-gray-700 font-medium pl-10">
                    <div className="flex items-center gap-2">
                      {head.label}
                      {isAutoCalculated && (
                        <span className={`inline-block px-2 py-0.5 text-white text-xs font-semibold rounded ${isEditable2037 && is2037Overridden ? 'bg-orange-500' : 'bg-blue-500'}`}>
                          {isEditable2037 && is2037Overridden ? 'Edited' : `Auto ${head.percentage}%`}
                        </span>
                      )}
                      {isEditable2037 && is2037Overridden && (
                        <button
                          type="button"
                          onClick={() => setIs2037Overridden(false)}
                          className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded hover:bg-gray-300 transition-colors"
                        >
                          Reset to Auto
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2.5 py-1 bg-gray-55 text-gray-600 font-semibold rounded text-xs border border-gray-200">
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
                        placeholder={isEditable2037 ? '' : '0'}
                        disabled={isDisabled}
                        className={`w-full pl-10 pr-3 py-2 text-xs text-right border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold transition-colors ${
                          isDisabled
                            ? 'bg-blue-100 border-blue-300 text-blue-900 cursor-not-allowed'
                            : isEditable2037 && !is2037Overridden
                              ? 'bg-blue-50 border-blue-200 text-blue-900 hover:border-blue-400'
                              : 'bg-white border-gray-300 text-gray-950 hover:border-gray-400'
                        }`}
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
                        placeholder={isEditable2037 ? '' : '0'}
                        disabled={isDisabled}
                        className={`w-full pl-10 pr-3 py-2 text-xs text-right border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold transition-colors ${
                          isDisabled
                            ? 'bg-blue-100 border-blue-300 text-blue-900 cursor-not-allowed'
                            : isEditable2037 && !is2037Overridden
                              ? 'bg-blue-50 border-blue-200 text-blue-900 hover:border-blue-400'
                              : 'bg-white border-gray-300 text-gray-950 hover:border-gray-400'
                        }`}
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
                        placeholder={isEditable2037 ? '' : '0'}
                        disabled={isDisabled}
                        className={`w-full pl-10 pr-3 py-2 text-xs text-right border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold transition-colors ${
                          isDisabled
                            ? 'bg-blue-100 border-blue-300 text-blue-900 cursor-not-allowed'
                            : isEditable2037 && !is2037Overridden
                              ? 'bg-blue-50 border-blue-200 text-blue-900 hover:border-blue-400'
                              : 'bg-white border-gray-300 text-gray-950 hover:border-gray-400'
                        }`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}

            <tr className="bg-gray-50 border-b border-gray-300">
              <td colSpan="5" className="px-4 py-2">
                <div className="flex justify-start">
                  <button
                    onClick={() => setShowAdditionalDeductions(!showAdditionalDeductions)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-300 bg-white text-blue-700 transition-all hover:bg-blue-50"
                    aria-label={showAdditionalDeductions ? 'Hide extra deduction rows' : 'Show extra deduction rows'}
                  >
                    <Plus className={`w-4 h-4 transition-transform ${showAdditionalDeductions ? 'rotate-45' : ''}`} />
                  </button>
                </div>
              </td>
            </tr>

            {showAdditionalDeductions && additionalDeductionHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-55 text-gray-600 font-semibold rounded text-xs border border-gray-200">
                    {head.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'total')}
                      onChange={(e) => handleChange(head.code, 'total', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'exempt')}
                      onChange={(e) => handleChange(head.code, 'exempt', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'normal')}
                      onChange={(e) => handleChange(head.code, 'normal', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>
              </tr>
            ))}

            {/* Extra Deduction Section */}
            {extraDeductionHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-55 text-gray-600 font-semibold rounded text-xs border border-gray-200">
                    {head.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getExtraDeductionValue(head.code)}
                      onChange={(e) => handleExtraDeductionChange(head.code, e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-gray-500">—</td>
                <td className="px-4 py-3 text-center text-gray-500">—</td>
              </tr>
            ))}

          </tbody>
        </table>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
        <table className="w-full text-sm bg-white border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white border-b border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-center font-semibold w-24 text-xs uppercase tracking-wider">Code</th>
              <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Extra Deduction Section for Deduction View */}
            {extraDeductionHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-55 text-gray-600 font-semibold rounded text-xs border border-gray-200">
                    {head.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getExtraDeductionValue(head.code)}
                      onChange={(e) => handleExtraDeductionChange(head.code, e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default SimplePropertyIncomeSection;