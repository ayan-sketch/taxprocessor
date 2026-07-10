import React, { useState, useEffect } from 'react';
import ReportsModal from './components/common/ReportsModal';
import AdvancedSearchPanel from './components/common/AdvancedSearchPanel';
import DuplicateDetectionPanel from './components/common/DuplicateDetectionPanel';
import EmailModal from './components/common/EmailModal';
import { applyAdvancedFilters, sortReturns } from './utils/advancedSearch';
import { mergeDuplicates } from './utils/duplicateDetection';

/**
 * Example Dashboard Integration
 * This file shows how to integrate all new features into your existing Dashboard
 */

export default function DashboardWithNewFeatures() {
  // Existing state (your current Dashboard state)
  const [taxReturns, setTaxReturns] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // New feature states
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [selectedReturns, setSelectedReturns] = useState([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Load tax returns (replace with your actual data loading)
  useEffect(() => {
    // Load your tax returns data here
    // Example:
    // const data = loadTaxReturnsFromStorage();
    // setTaxReturns(data);
    // setFilteredReturns(data);
  }, []);

  // Handle advanced filter application
  const handleApplyFilters = (filters) => {
    const filtered = applyAdvancedFilters(taxReturns, filters);
    setFilteredReturns(filtered);
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setFilteredReturns(taxReturns);
  };

  // Handle duplicate merge
  const handleMergeDuplicates = (group) => {
    try {
      const merged = mergeDuplicates(group.records);
      
      // Remove duplicate records and add merged record
      const updatedReturns = taxReturns.filter(ret => 
        !group.records.some(dup => dup.index === ret.index)
      );
      updatedReturns.push(merged);
      
      setTaxReturns(updatedReturns);
      setFilteredReturns(updatedReturns);
      
      alert(`Successfully merged ${group.count} duplicate records`);
    } catch (error) {
      alert('Error merging duplicates: ' + error.message);
    }
  };

  // Handle return selection (for bulk email)
  const handleSelectReturn = (returnObj) => {
    setSelectedReturns(prev => {
      const isSelected = prev.some(r => r.cnicNtn === returnObj.cnicNtn && r.taxYear === returnObj.taxYear);
      if (isSelected) {
        return prev.filter(r => !(r.cnicNtn === returnObj.cnicNtn && r.taxYear === returnObj.taxYear));
      } else {
        return [...prev, returnObj];
      }
    });
  };

  // Handle select all returns
  const handleSelectAll = () => {
    if (selectedReturns.length === filteredReturns.length) {
      setSelectedReturns([]);
    } else {
      setSelectedReturns([...filteredReturns]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with new action buttons */}
      <div className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Tax Automation Dashboard</h1>
          
          <div className="flex gap-3">
            {/* Advanced Search Toggle */}
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Advanced Search
            </button>

            {/* Reports & Export Button */}
            <button
              onClick={() => setShowReportsModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Reports & Export
            </button>

            {/* Email Clients Button */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Clients
              {selectedReturns.length > 0 && (
                <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {selectedReturns.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Advanced Search Panel (collapsible) */}
        {showAdvancedSearch && (
          <AdvancedSearchPanel
            onApplyFilters={handleApplyFilters}
            onReset={handleResetFilters}
          />
        )}

        {/* Duplicate Detection Panel */}
        <DuplicateDetectionPanel
          returns={taxReturns}
          onMergeDuplicates={handleMergeDuplicates}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Total Returns</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {filteredReturns.length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Selected</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {selectedReturns.length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">With Email</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {filteredReturns.filter(r => r.email).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Urgent Deadlines</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {filteredReturns.filter(r => {
                if (!r.deadline) return false;
                const deadline = new Date(r.deadline);
                const now = new Date();
                const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                return daysUntil >= 0 && daysUntil <= 7;
              }).length}
            </p>
          </div>
        </div>

        {/* Tax Returns Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Tax Returns</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
                {selectedReturns.length === filteredReturns.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      checked={selectedReturns.length === filteredReturns.length && filteredReturns.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNIC/NTN</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax Year</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReturns.map((ret, index) => {
                  const isSelected = selectedReturns.some(
                    r => r.cnicNtn === ret.cnicNtn && r.taxYear === ret.taxYear
                  );
                  return (
                    <tr key={index} className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectReturn(ret)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{ret.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ret.cnicNtn}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ret.taxYear}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ret.status === 'Filed' ? 'bg-green-100 text-green-800' :
                          ret.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ret.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ret.incomeAmount || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ret.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {ret.deadline ? new Date(ret.deadline).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredReturns.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No tax returns found. Try adjusting your filters.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        returns={filteredReturns.length > 0 ? filteredReturns : taxReturns}
      />

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        returns={taxReturns}
        selectedReturns={selectedReturns}
      />
    </div>
  );
}
