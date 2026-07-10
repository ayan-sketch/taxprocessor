/**
 * Search and Filter Component
 * Advanced search and filtering for tax returns
 */

import React, { useState } from 'react';
import { Search, Filter, X, Calendar, DollarSign, User } from 'lucide-react';

const SearchAndFilter = ({ returns, onFilteredResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    taxYear: '',
    status: '',
    hasRefund: '',
    minIncome: '',
    maxIncome: '',
    sortBy: 'processed_at',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (term) => {
    setSearchTerm(term);
    applyFiltersAndSearch(term, filters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFiltersAndSearch(searchTerm, newFilters);
  };

  const applyFiltersAndSearch = (term, currentFilters) => {
    let filtered = [...returns];

    // Search by name, CNIC, NTN
    if (term) {
      const searchLower = term.toLowerCase();
      filtered = filtered.filter(ret => 
        (ret.client_name && ret.client_name.toLowerCase().includes(searchLower)) ||
        (ret.cnic && ret.cnic.includes(term)) ||
        (ret.ntn && ret.ntn.includes(term)) ||
        (ret.tax_year && ret.tax_year.includes(term))
      );
    }

    // Filter by tax year
    if (currentFilters.taxYear) {
      filtered = filtered.filter(ret => ret.tax_year === currentFilters.taxYear);
    }

    // Filter by status
    if (currentFilters.status) {
      filtered = filtered.filter(ret => ret.status === currentFilters.status);
    }

    // Filter by refund status
    if (currentFilters.hasRefund === 'yes') {
      filtered = filtered.filter(ret => ret.refund_amount && parseFloat(ret.refund_amount) > 0);
    } else if (currentFilters.hasRefund === 'no') {
      filtered = filtered.filter(ret => !ret.refund_amount || parseFloat(ret.refund_amount) === 0);
    }

    // Filter by income range
    if (currentFilters.minIncome) {
      filtered = filtered.filter(ret => 
        ret.total_income && parseFloat(ret.total_income) >= parseFloat(currentFilters.minIncome)
      );
    }
    if (currentFilters.maxIncome) {
      filtered = filtered.filter(ret => 
        ret.total_income && parseFloat(ret.total_income) <= parseFloat(currentFilters.maxIncome)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (currentFilters.sortBy) {
        case 'client_name':
          aVal = a.client_name || '';
          bVal = b.client_name || '';
          break;
        case 'tax_year':
          aVal = a.tax_year || '';
          bVal = b.tax_year || '';
          break;
        case 'total_income':
          aVal = parseFloat(a.total_income) || 0;
          bVal = parseFloat(b.total_income) || 0;
          break;
        case 'refund_amount':
          aVal = parseFloat(a.refund_amount) || 0;
          bVal = parseFloat(b.refund_amount) || 0;
          break;
        case 'processed_at':
        default:
          aVal = new Date(a.processed_at || 0);
          bVal = new Date(b.processed_at || 0);
          break;
      }

      if (currentFilters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    onFilteredResults(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      taxYear: '',
      status: '',
      hasRefund: '',
      minIncome: '',
      maxIncome: '',
      sortBy: 'processed_at',
      sortOrder: 'desc'
    });
    onFilteredResults(returns);
  };

  const getUniqueYears = () => {
    const years = returns.map(ret => ret.tax_year).filter(Boolean);
    return [...new Set(years)].sort().reverse();
  };

  const getUniqueStatuses = () => {
    const statuses = returns.map(ret => ret.status).filter(Boolean);
    return [...new Set(statuses)];
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'processed_at' && v !== 'desc').length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, CNIC, NTN, or tax year..."
            className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            showFilters || activeFilterCount > 0
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'bg-black/30 text-gray-400 border border-white/10 hover:bg-black/40'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-6 bg-black/20 border border-white/10 rounded-xl space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tax Year */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tax Year
              </label>
              <select
                value={filters.taxYear}
                onChange={(e) => handleFilterChange('taxYear', e.target.value)}
                className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All Years</option>
                {getUniqueYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All Statuses</option>
                {getUniqueStatuses().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Has Refund */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Refund Status
              </label>
              <select
                value={filters.hasRefund}
                onChange={(e) => handleFilterChange('hasRefund', e.target.value)}
                className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All</option>
                <option value="yes">With Refund</option>
                <option value="no">No Refund</option>
              </select>
            </div>

            {/* Min Income */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Min Income (PKR)
              </label>
              <input
                type="number"
                value={filters.minIncome}
                onChange={(e) => handleFilterChange('minIncome', e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Max Income */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Max Income (PKR)
              </label>
              <input
                type="number"
                value={filters.maxIncome}
                onChange={(e) => handleFilterChange('maxIncome', e.target.value)}
                placeholder="∞"
                className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="processed_at">Date Processed</option>
                  <option value="client_name">Client Name</option>
                  <option value="tax_year">Tax Year</option>
                  <option value="total_income">Income</option>
                  <option value="refund_amount">Refund</option>
                </select>
                <button
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white hover:bg-black/40 transition-colors"
                  title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
