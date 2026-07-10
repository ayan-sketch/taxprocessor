import React from 'react';
import { Home, Plus, Trash2, DollarSign } from 'lucide-react';

const PropertyIncomeSection = ({ data, onUpdate }) => {
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
          propertyAddress: '',
          propertyType: '',
          annualRent: '',
          repairMaintenance: '',
          insurance: '',
          otherExpenses: '',
          netRental: ''
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

  const calculateNetRental = (entry) => {
    const rent = parseFloat(entry.annualRent) || 0;
    const repair = parseFloat(entry.repairMaintenance) || 0;
    const insurance = parseFloat(entry.insurance) || 0;
    const other = parseFloat(entry.otherExpenses) || 0;
    return rent - repair - insurance - other;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Home className="w-6 h-6 text-blue-600" />
          Property Income
        </h2>
        <p className="text-gray-600 mt-1">
          Provide details of income from house property or rental income
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
            I have property/rental income to report
          </span>
        </label>
      </div>

      {/* Property Entries */}
      {data.hasIncome && (
        <div className="space-y-4">
          {data.entries.map((entry, index) => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              {/* Entry Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-semibold text-gray-900">
                  Property #{index + 1}
                </h3>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Property Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={entry.propertyAddress}
                  onChange={(e) => updateEntry(entry.id, 'propertyAddress', e.target.value)}
                  placeholder="Enter property address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={entry.propertyType}
                  onChange={(e) => updateEntry(entry.id, 'propertyType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Agricultural">Agricultural Land</option>
                  <option value="Plot">Plot/Land</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Income Details */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Rental Income <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={entry.annualRent}
                      onChange={(e) => updateEntry(entry.id, 'annualRent', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repair & Maintenance
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={entry.repairMaintenance}
                        onChange={(e) => updateEntry(entry.id, 'repairMaintenance', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Premium
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={entry.insurance}
                        onChange={(e) => updateEntry(entry.id, 'insurance', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other Expenses
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={entry.otherExpenses}
                        onChange={(e) => updateEntry(entry.id, 'otherExpenses', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-900">Net Rental Income:</span>
                    <span className="text-lg font-bold text-green-900">
                      Rs. {calculateNetRental(entry).toLocaleString()}
                    </span>
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
            Add Another Property
          </button>
        </div>
      )}

      {/* Summary */}
      {data.hasIncome && data.entries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Total Property Income:</span>
            <span className="text-lg font-bold text-blue-900">
              Rs. {data.entries.reduce((sum, entry) => sum + calculateNetRental(entry), 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyIncomeSection;
