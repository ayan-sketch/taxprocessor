import React from 'react';
import { Coins, Plus, Trash2, DollarSign } from 'lucide-react';

const OtherIncomeSection = ({ data, onUpdate }) => {
  const handleToggleIncome = (value) => {
    onUpdate({
      ...data,
      hasIncome: value,
      entries: value ? data.entries : []
    });
  };

  const addEntry = () => {
    onUpdate({
      ...data,
      entries: [
        ...data.entries,
        {
          id: Date.now(),
          incomeType: '',
          description: '',
          amount: '',
          taxDeducted: ''
        }
      ]
    });
  };

  const removeEntry = (id) => {
    onUpdate({
      ...data,
      entries: data.entries.filter(entry => entry.id !== id)
    });
  };

  const updateEntry = (id, field, value) => {
    onUpdate({
      ...data,
      entries: data.entries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    });
  };

  const calculateNetIncome = (entry) => {
    const amount = parseFloat(entry.amount) || 0;
    const taxDeducted = parseFloat(entry.taxDeducted) || 0;
    return amount - taxDeducted;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Coins className="w-6 h-6 text-blue-600" />
          Other Income
        </h2>
        <p className="text-gray-600 mt-1">
          Provide details of other income sources not covered in previous sections
        </p>
      </div>

      {/* Toggle Income */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hasIncome}
            onChange={(e) => handleToggleIncome(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            I have other income to report
          </span>
        </label>
      </div>

      {/* Other Income Entries */}
      {data.hasIncome && (
        <div className="space-y-4">
          {data.entries.map((entry, index) => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              {/* Entry Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-semibold text-gray-900">
                  Other Income #{index + 1}
                </h3>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Income Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Income Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={entry.incomeType}
                  onChange={(e) => updateEntry(entry.id, 'incomeType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select income type</option>
                  <option value="Dividend">Dividend Income</option>
                  <option value="Interest">Interest Income (Bank/Bonds)</option>
                  <option value="Foreign">Foreign Income</option>
                  <option value="Agricultural">Agricultural Income</option>
                  <option value="Prize">Prize Money/Winnings</option>
                  <option value="Royalty">Royalty/Commission</option>
                  <option value="Pension">Pension</option>
                  <option value="Gift">Gifts (taxable)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={entry.description}
                  onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                  placeholder="Brief description of income source"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gross Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => updateEntry(entry.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Deducted (if any)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={entry.taxDeducted}
                      onChange={(e) => updateEntry(entry.id, 'taxDeducted', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Net Income Display */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">Net Income:</span>
                  <span className="text-lg font-bold text-green-900">
                    Rs. {calculateNetIncome(entry).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Add Entry Button */}
          <button
            onClick={addEntry}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Another Income Source
          </button>
        </div>
      )}

      {/* Summary */}
      {data.hasIncome && data.entries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Total Other Income:</span>
            <span className="text-lg font-bold text-blue-900">
              Rs. {data.entries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          <strong>Note:</strong> Include all sources of income not covered in previous sections. 
          Agricultural income, while exempt, should still be reported for correct tax calculation.
        </p>
      </div>
    </div>
  );
};

export default OtherIncomeSection;
