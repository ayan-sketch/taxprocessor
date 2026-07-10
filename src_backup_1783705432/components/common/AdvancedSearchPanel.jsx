import React, { useState } from 'react';
import { getIncomeBrackets, getStatusOptions } from '../../utils/advancedSearch';

export default function AdvancedSearchPanel({ onApplyFilters, onReset }) {
  const [filters, setFilters] = useState({
    searchQuery: '',
    startDate: '',
    endDate: '',
    dateField: 'processedDate',
    startYear: '',
    endYear: '',
    minIncome: '',
    maxIncome: '',
    statuses: [],
    minTax: '',
    maxTax: '',
    minRefund: '',
    maxRefund: '',
    highValueOnly: false,
    highValueThreshold: 1000000,
    urgentOnly: false,
    urgentDaysThreshold: 7,
    overdueOnly: false
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const incomeBrackets = getIncomeBrackets();
  const statusOptions = getStatusOptions();

  const handleInputChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusToggle = (status) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  const handleIncomeBracketSelect = (bracket) => {
    setFilters(prev => ({
      ...prev,
      minIncome: bracket.min,
      maxIncome: bracket.max || ''
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      searchQuery: '',
      startDate: '',
      endDate: '',
      dateField: 'processedDate',
      startYear: '',
      endYear: '',
      minIncome: '',
      maxIncome: '',
      statuses: [],
      minTax: '',
      maxTax: '',
      minRefund: '',
      maxRefund: '',
      highValueOnly: false,
      highValueThreshold: 1000000,
      urgentOnly: false,
      urgentDaysThreshold: 7,
      overdueOnly: false
    };
    setFilters(resetFilters);
    onReset();
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'dateField' || key === 'highValueThreshold' || key === 'urgentDaysThreshold') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return value !== '';
  }).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {/* Basic Search */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, CNIC/NTN, notes..."
            value={filters.searchQuery}
            onChange={(e) => handleInputChange('searchQuery', e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            {showAdvanced ? 'Hide' : 'Advanced'} {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Search
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 border-t pt-4">
          {/* Quick Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Filters
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleInputChange('highValueOnly', !filters.highValueOnly)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filters.highValueOnly
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                High Value Returns
              </button>
              <button
                onClick={() => handleInputChange('urgentOnly', !filters.urgentOnly)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filters.urgentOnly
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Urgent Deadlines
              </button>
              <button
                onClick={() => handleInputChange('overdueOnly', !filters.overdueOnly)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filters.overdueOnly
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Overdue
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    filters.statuses.includes(status)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Field
              </label>
              <select
                value={filters.dateField}
                onChange={(e) => handleInputChange('dateField', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="processedDate">Processed Date</option>
                <option value="filingDate">Filing Date</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tax Year Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Year From
              </label>
              <input
                type="number"
                placeholder="e.g., 2020"
                value={filters.startYear}
                onChange={(e) => handleInputChange('startYear', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Year To
              </label>
              <input
                type="number"
                placeholder="e.g., 2025"
                value={filters.endYear}
                onChange={(e) => handleInputChange('endYear', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Income Bracket */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Income Bracket (Quick Select)
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {incomeBrackets.map((bracket, index) => (
                <button
                  key={index}
                  onClick={() => handleIncomeBracketSelect(bracket)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  {bracket.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Income</label>
                <input
                  type="number"
                  placeholder="Minimum"
                  value={filters.minIncome}
                  onChange={(e) => handleInputChange('minIncome', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Income</label>
                <input
                  type="number"
                  placeholder="Maximum"
                  value={filters.maxIncome}
                  onChange={(e) => handleInputChange('maxIncome', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tax Paid Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Tax Paid
              </label>
              <input
                type="number"
                placeholder="Minimum"
                value={filters.minTax}
                onChange={(e) => handleInputChange('minTax', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tax Paid
              </label>
              <input
                type="number"
                placeholder="Maximum"
                value={filters.maxTax}
                onChange={(e) => handleInputChange('maxTax', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Refund Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Refund Amount
              </label>
              <input
                type="number"
                placeholder="Minimum"
                value={filters.minRefund}
                onChange={(e) => handleInputChange('minRefund', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Refund Amount
              </label>
              <input
                type="number"
                placeholder="Maximum"
                value={filters.maxRefund}
                onChange={(e) => handleInputChange('maxRefund', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
