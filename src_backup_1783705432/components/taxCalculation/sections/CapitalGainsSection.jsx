import React from 'react';
import { TrendingUp, Plus, Trash2, DollarSign } from 'lucide-react';

const CapitalGainsSection = ({ data, onUpdate }) => {
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
          assetType: '',
          description: '',
          purchaseDate: '',
          purchasePrice: '',
          saleDate: '',
          salePrice: '',
          expenses: '',
          capitalGain: ''
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

  const calculateCapitalGain = (entry) => {
    const sale = parseFloat(entry.salePrice) || 0;
    const purchase = parseFloat(entry.purchasePrice) || 0;
    const expenses = parseFloat(entry.expenses) || 0;
    return sale - purchase - expenses;
  };

  const getHoldingPeriod = (entry) => {
    if (!entry.purchaseDate || !entry.saleDate) return 'N/A';
    const purchase = new Date(entry.purchaseDate);
    const sale = new Date(entry.saleDate);
    const years = Math.floor((sale - purchase) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((sale - purchase) / (1000 * 60 * 60 * 24 * 30)) % 12;
    return `${years}y ${months}m`;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Capital Gains
        </h2>
        <p className="text-gray-600 mt-1">
          Provide details of gains from sale of capital assets (property, shares, securities)
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
            I have capital gains to report
          </span>
        </label>
      </div>

      {/* Capital Gains Entries */}
      {data.hasIncome && (
        <div className="space-y-4">
          {data.entries.map((entry, index) => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              {/* Entry Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-semibold text-gray-900">
                  Asset #{index + 1}
                </h3>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Asset Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={entry.assetType}
                    onChange={(e) => updateEntry(entry.id, 'assetType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="Immovable Property">Immovable Property</option>
                    <option value="Shares">Shares/Securities</option>
                    <option value="Jewelry">Jewelry/Precious Metals</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Other">Other Asset</option>
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
                    placeholder="Brief description of asset"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Purchase Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={entry.purchaseDate}
                    onChange={(e) => updateEntry(entry.id, 'purchaseDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={entry.purchasePrice}
                      onChange={(e) => updateEntry(entry.id, 'purchasePrice', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sale Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={entry.saleDate}
                    onChange={(e) => updateEntry(entry.id, 'saleDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={entry.salePrice}
                      onChange={(e) => updateEntry(entry.id, 'salePrice', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Expenses & Results */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Expenses
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={entry.expenses}
                      onChange={(e) => updateEntry(entry.id, 'expenses', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Holding Period
                  </label>
                  <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 font-medium">
                    {getHoldingPeriod(entry)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capital Gain
                  </label>
                  <div className={`px-4 py-2 border border-gray-300 rounded-lg font-semibold ${
                    calculateCapitalGain(entry) >= 0 ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
                  }`}>
                    Rs. {calculateCapitalGain(entry).toLocaleString()}
                  </div>
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
            Add Another Asset
          </button>
        </div>
      )}

      {/* Summary */}
      {data.hasIncome && data.entries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Total Capital Gains:</span>
            <span className="text-lg font-bold text-blue-900">
              Rs. {data.entries.reduce((sum, entry) => sum + calculateCapitalGain(entry), 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalGainsSection;
