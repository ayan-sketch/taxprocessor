import React, { useEffect } from 'react';

const SimpleCapitalGainsSection = ({ data, onUpdate }) => {
  // Long-term securities section codes
  const longTermHeads = [
    { code: '4006', label: 'Consideration Received on Disposal of Securities held Long Term' },
    { code: '4016', label: 'Cost of Acquisition of Securities including Ancillary Expenses held Long Term' },
    { code: '4017', label: 'Net Gain / (Loss) on Securities held long term' }
  ];

  // Short-term securities section codes
  const shortTermHeads = [
    { code: '4026', label: 'Consideration Received on Disposal of Securities held Short Term' },
    { code: '4036', label: 'Cost of Acquisition of Securities including Ancillary Expenses held Short Term' },
    { code: '4037', label: 'Net Gain / (Loss) on Securities held Short Term' }
  ];

  const allHeads = [...longTermHeads, ...shortTermHeads];

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
        <p className="text-sm">Enable this income type to add capital gains details.</p>
      </div>
    );
  }

  // Calculate sum of long-term gains
  const longTermTotal = calculateSum(longTermHeads, 'total');
  const longTermExempt = calculateSum(longTermHeads, 'exempt');
  const longTermNormal = calculateSum(longTermHeads, 'normal');

  // Calculate sum of short-term gains
  const shortTermTotal = calculateSum(shortTermHeads, 'total');
  const shortTermExempt = calculateSum(shortTermHeads, 'exempt');
  const shortTermNormal = calculateSum(shortTermHeads, 'normal');

  // Calculate net capital gains (4000) = Long Term + Short Term
  const netCapitalTotal = longTermTotal + shortTermTotal;
  const netCapitalExempt = longTermExempt + shortTermExempt;
  const netCapitalNormal = longTermNormal + shortTermNormal;

  return (
    <div className="space-y-4">
      {/* Table */}
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
            {/* Gains / (Loss) from Capital Assets - READ ONLY Header Row (Code 4000) */}
            <tr className="bg-rose-100 border-b-2 border-rose-200">
              <td className="px-4 py-4 font-bold text-gray-900">
                Gains / (Loss) from Capital Assets
              </td>
              <td className="px-4 py-4 text-center">
                <span className="inline-block px-3 py-1 bg-rose-200 text-rose-900 font-bold rounded text-xs">
                  4000
                </span>
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {netCapitalTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {netCapitalExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900 text-rose-900">
                Rs. {netCapitalNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
            </tr>

            {/* LONG-TERM SECURITIES SECTION */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <td colSpan="5" className="px-4 py-2 font-semibold text-gray-800 text-sm">
                Long-Term Securities
              </td>
            </tr>

            {longTermHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 font-semibold rounded text-xs border border-gray-200">
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

            {/* SHORT-TERM SECURITIES SECTION */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <td colSpan="5" className="px-4 py-2 font-semibold text-gray-800 text-sm">
                Short-Term Securities
              </td>
            </tr>

            {shortTermHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 font-semibold rounded text-xs border border-gray-200">
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
          </tbody>
        </table>
      </div>

      {/* Summary Box */}
      <div className="bg-rose-50 border-2 border-rose-200 rounded-lg p-3 text-xs text-rose-900">
        <p>
          <strong>Capital Gains (4000):</strong> Calculated as Long-Term Securities (4006-4017) plus Short-Term Securities (4026-4037). All fields are editable per FBR IRIS code specifications.
        </p>
      </div>
    </div>
  );
};

export default SimpleCapitalGainsSection;
