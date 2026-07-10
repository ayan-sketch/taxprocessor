import React, { useState, useEffect } from 'react';
import { Globe, Leaf } from 'lucide-react';

const SimpleForeignSourceSection = ({ data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('foreign');

  // Foreign income heads
  const foreignIncomeHeads = [
    { code: '6011', label: 'Foreign Salary Income' },
    { code: '6029', label: 'Foreign Property Income / (Loss)' },
    { code: '6039', label: 'Foreign Business Income / (Loss)' },
    { code: '6049', label: 'Foreign Capital Gains / (Loss)' },
    { code: '6059', label: 'Foreign Other Sources Income / (Loss)' }
  ];

  // Agriculture income head
  const agricultureHead = { code: '6100', label: 'Agriculture Income' };

  // All heads combined
  const allHeads = [...foreignIncomeHeads, agricultureHead];

  // Initialize fields if not present
  useEffect(() => {
    let updated = false;
    const newData = { ...data };

    // Initialize foreign income fields
    foreignIncomeHeads.forEach(head => {
      if (!newData[head.code]) {
        newData[head.code] = { total: '', exempt: '', normal: '' };
        updated = true;
      }
    });

    // Initialize agriculture income fields
    if (!newData[agricultureHead.code]) {
      newData[agricultureHead.code] = { total: '', exempt: '', normal: '', taxPaid: '' };
      updated = true;
    }

    if (updated) {
      onUpdate(newData);
    }
  }, [data]);

  const handleChange = (code, field, value) => {
    const headData = data[code] || { total: '', exempt: '', normal: '', taxPaid: '' };
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

  const calculateForeignSum = (field) => {
    return foreignIncomeHeads.reduce((sum, head) => {
      return sum + (parseFloat(data[head.code]?.[field]) || 0);
    }, 0);
  };

  if (!data.hasIncome) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-sm">Enable this income type to add foreign source or agriculture details.</p>
      </div>
    );
  }

  // Calculate totals for Foreign Income (6000)
  const totalForeignTotal = calculateForeignSum('total');
  const totalForeignExempt = calculateForeignSum('exempt');
  const totalForeignNormal = calculateForeignSum('normal');

  return (
    <div className="space-y-4">
      {/* Sub-tabs for Foreign Source and Agriculture */}
      <div className="flex gap-2 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('foreign')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
            activeTab === 'foreign'
              ? 'text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50'
              : 'text-gray-600 hover:text-cyan-600 hover:bg-gray-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          Foreign Source
        </button>
        <button
          onClick={() => setActiveTab('agriculture')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
            activeTab === 'agriculture'
              ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
              : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
          }`}
        >
          <Leaf className="w-4 h-4" />
          Agriculture
        </button>
      </div>

      {/* Foreign Source Tab Content */}
      {activeTab === 'foreign' && (
        <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
          <table className="w-full text-sm bg-white border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-cyan-700 to-cyan-600 text-white border-b border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-center font-semibold w-24 text-xs uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Total Amount</th>
                <th className="px-4 py-3 text-right font-semibold w-48 text-xs uppercase tracking-wider">Amount Exempt from Tax / Subject to Fixed / Final Tax</th>
                <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Amount Subject to Normal Tax</th>
              </tr>
            </thead>
            <tbody>
              {/* Foreign Income - READ ONLY Header Row (Code 6000) */}
              <tr className="bg-gradient-to-r from-cyan-100 to-cyan-50 border-b border-gray-300">
                <td className="px-4 py-4 font-bold text-gray-900">
                  Foreign Income
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-block px-3 py-1 bg-cyan-600 text-white font-bold rounded-md text-xs shadow-sm">
                    6000
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-bold text-gray-900">
                  Rs. {totalForeignTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-4 text-right font-bold text-gray-900">
                  Rs. {totalForeignExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-4 text-right font-bold text-gray-900">
                  Rs. {totalForeignNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                </td>
              </tr>

              {/* Foreign Income Detail Rows */}
              {foreignIncomeHeads.map((head) => (
                <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-cyan-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {head.label}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-xs border border-gray-300">
                      {head.code}
                    </span>
                  </td>
                  {/* Total Amount Input */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        value={getVal(head.code, 'total')}
                        onChange={(e) => handleChange(head.code, 'total', e.target.value)}
                        placeholder="0"
                        className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-gray-950 font-semibold transition-all hover:border-cyan-400 hover:shadow-sm"
                      />
                    </div>
                  </td>
                  {/* Exempt Amount Input */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        value={getVal(head.code, 'exempt')}
                        onChange={(e) => handleChange(head.code, 'exempt', e.target.value)}
                        placeholder="0"
                        className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-gray-950 font-semibold transition-all hover:border-cyan-400 hover:shadow-sm"
                      />
                    </div>
                  </td>
                  {/* Normal Tax Amount Input */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        value={getVal(head.code, 'normal')}
                        onChange={(e) => handleChange(head.code, 'normal', e.target.value)}
                        placeholder="0"
                        className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-gray-950 font-semibold transition-all hover:border-cyan-400 hover:shadow-sm"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Agriculture Tab Content */}
      {activeTab === 'agriculture' && (
        <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
          <table className="w-full text-sm bg-white border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-green-700 to-green-600 text-white border-b border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-center font-semibold w-24 text-xs uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Total Agriculture Income</th>
                <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Exempt Agriculture Income</th>
                <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Amount Subject to Normal Tax</th>
                <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Tax Paid in Province</th>
              </tr>
            </thead>
            <tbody>
              {/* Agriculture Income Row (Code 6100) */}
              <tr className="border-b border-gray-200 bg-white hover:bg-green-50 transition-colors">
                <td className="px-4 py-3 text-gray-800 font-medium">
                  {agricultureHead.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 font-semibold rounded text-xs border border-green-300">
                    {agricultureHead.code}
                  </span>
                </td>
                {/* Total Agriculture Income Input */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(agricultureHead.code, 'total')}
                      onChange={(e) => handleChange(agricultureHead.code, 'total', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-950 font-semibold transition-all hover:border-green-400 hover:shadow-sm"
                    />
                  </div>
                </td>
                {/* Exempt Agriculture Income Input */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(agricultureHead.code, 'exempt')}
                      onChange={(e) => handleChange(agricultureHead.code, 'exempt', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-950 font-semibold transition-all hover:border-green-400 hover:shadow-sm"
                    />
                  </div>
                </td>
                {/* Amount Subject to Normal Tax Input */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(agricultureHead.code, 'normal')}
                      onChange={(e) => handleChange(agricultureHead.code, 'normal', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-950 font-semibold transition-all hover:border-green-400 hover:shadow-sm"
                    />
                  </div>
                </td>
                {/* Tax Paid in Province Input */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(agricultureHead.code, 'taxPaid')}
                      onChange={(e) => handleChange(agricultureHead.code, 'taxPaid', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-950 font-semibold transition-all hover:border-green-400 hover:shadow-sm"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SimpleForeignSourceSection;
