import React from 'react';

const IncomeSummaryCard = ({ formData }) => {
  // Helpers to calculate totals from code-based structure
  const getSalaryTotals = () => {
    const data = formData.salaryIncome;
    if (!data.hasIncome) return null;

    // Sum from code 1000 (which aggregates all salary heads)
    const codeData = data['1000'];
    if (!codeData) return null;

    const total = parseFloat(codeData.total) || 0;
    const exempt = parseFloat(codeData.exempt) || 0;
    const normal = parseFloat(codeData.normal) || 0;

    if (total === 0 && exempt === 0 && normal === 0) return null;
    return { title: 'Income from Salary', code: '1000', total, exempt, normal };
  };

  const getPropertyTotals = () => {
    const data = formData.propertyIncome;
    if (!data.hasIncome) return null;

    // Sum from code 2000 (which aggregates property income/loss)
    const codeData = data['2000'];
    if (!codeData) return null;

    const total = parseFloat(codeData.total) || 0;
    const exempt = parseFloat(codeData.exempt) || 0;
    const normal = parseFloat(codeData.normal) || 0;

    if (total === 0 && exempt === 0 && normal === 0) return null;
    return { title: 'Income / (Loss) from Property', code: '2000', total, exempt, normal };
  };

  const getBusinessTotals = () => {
    const data = formData.businessIncome;
    if (!data.hasIncome || !data.entries) return null;
    const total = data.entries.reduce((sum, e) => sum + (parseFloat(e.netProfit) || 0), 0);
    if (total === 0) return null;
    return { title: 'Income from Business', code: '3000', total, exempt: 0, normal: total };
  };

  const getCapitalGainsTotals = () => {
    const data = formData.capitalGains;
    if (!data.hasIncome) return null;

    // Calculate from code-based structure (4000 aggregates all capital gains)
    const longTermHeads = ['4006', '4016', '4017'];
    const shortTermHeads = ['4026', '4036', '4037'];
    const allHeads = [...longTermHeads, ...shortTermHeads];

    let total = 0, exempt = 0, normal = 0;
    allHeads.forEach(code => {
      if (data[code]) {
        total += parseFloat(data[code].total) || 0;
        exempt += parseFloat(data[code].exempt) || 0;
        normal += parseFloat(data[code].normal) || 0;
      }
    });

    if (total === 0 && exempt === 0 && normal === 0) return null;
    return { title: 'Gains / (Loss) from Capital Assets', code: '4000', total, exempt, normal };
  };

  const getOtherIncomeTotals = () => {
    const data = formData.otherIncome;
    if (!data.hasIncome || !data.entries) return null;
    const total = data.entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    if (total === 0) return null;
    return { title: 'Income from Other Sources', code: '5000', total, exempt: 0, normal: total };
  };

  const getForeignSourceTotals = () => {
    const data = formData.foreignSource;
    if (!data.hasIncome || !data.entries) return null;
    const total = data.entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    if (total === 0) return null;
    return { title: 'Foreign Source Income', code: '6000', total, exempt: 0, normal: total };
  };

  const summaryItems = [
    getSalaryTotals(),
    getPropertyTotals(),
    getBusinessTotals(),
    getCapitalGainsTotals(),
    getOtherIncomeTotals(),
    getForeignSourceTotals()
  ].filter(Boolean); // Filter out nulls

  if (summaryItems.length === 0) {
    return null; // Don't show the summary card if no income has been entered
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-4">
      <div className="bg-blue-50 border-b border-gray-200 px-5 py-3">
        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
          Income Computation Summary
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-5 py-2 text-left font-semibold">Description</th>
              <th className="px-5 py-2 text-center font-semibold w-24">Code</th>
              <th className="px-5 py-2 text-right font-semibold w-40">Total Amount</th>
              <th className="px-5 py-2 text-right font-semibold w-40">Exempt / Final Tax</th>
              <th className="px-5 py-2 text-right font-semibold w-40">Normal Tax</th>
            </tr>
          </thead>
          <tbody>
            {summaryItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <span className="font-bold text-gray-800">{item.title}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className="inline-block px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-bold">
                    {item.code}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="font-semibold text-gray-800">
                    Rs. {item.total.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="font-semibold text-gray-600">
                    Rs. {item.exempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="font-semibold text-blue-700">
                    Rs. {item.normal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncomeSummaryCard;
