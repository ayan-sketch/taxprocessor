import React, { useState, useEffect } from 'react';
import { detectDuplicates, checkForDuplicate } from '../../utils/duplicateDetection';

export default function DuplicateDetectionPanel({ returns, onMergeDuplicates }) {
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Detect duplicates whenever returns change
    const result = detectDuplicates(returns);
    if (result.hasDuplicates) {
      setDuplicateGroups(result.duplicates);
    } else {
      setDuplicateGroups([]);
    }
  }, [returns]);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setShowWarning(true);
  };

  const handleMerge = (group) => {
    onMergeDuplicates(group);
    setShowWarning(false);
    setSelectedGroup(null);
  };

  if (duplicateGroups.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-800 font-medium">No duplicate returns detected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-yellow-800 font-bold">
              {duplicateGroups.length} Duplicate Group{duplicateGroups.length > 1 ? 's' : ''} Found
            </h3>
            <p className="text-yellow-700 text-sm mt-1">
              Multiple returns found with the same CNIC/NTN and tax year. Review and merge duplicates to maintain data integrity.
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate Groups List */}
      <div className="space-y-3">
        {duplicateGroups.map((group, index) => (
          <div key={group.key} className="bg-white border border-red-300 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-gray-800">{group.name}</h4>
                <p className="text-sm text-gray-600">
                  CNIC/NTN: {group.cnicNtn} | Tax Year: {group.taxYear}
                </p>
                <p className="text-sm text-red-600 font-medium mt-1">
                  {group.count} duplicate records found
                </p>
              </div>
              <button
                onClick={() => handleSelectGroup(group)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                Review & Merge
              </button>
            </div>

            {/* Show records in group */}
            <div className="space-y-2 mt-3 border-t pt-3">
              {group.records.map((record, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-600">Status:</span>{' '}
                      <span className="font-medium">{record.status || 'Pending'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Income:</span>{' '}
                      <span className="font-medium">{record.incomeAmount || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Processed:</span>{' '}
                      <span className="font-medium">
                        {record.processedDate ? new Date(record.processedDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">File:</span>{' '}
                      <span className="font-medium text-xs">{record.filePath?.split('/').pop() || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Merge Modal */}
      {showWarning && selectedGroup && (
        <DuplicateMergeModal
          group={selectedGroup}
          onMerge={handleMerge}
          onCancel={() => {
            setShowWarning(false);
            setSelectedGroup(null);
          }}
        />
      )}
    </div>
  );
}

// Duplicate Merge Modal Component
function DuplicateMergeModal({ group, onMerge, onCancel }) {
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  const [mergeStrategy, setMergeStrategy] = useState('keepMostRecent');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-800">Merge Duplicate Returns</h2>
          <p className="text-sm text-gray-600 mt-1">
            {group.name} - CNIC/NTN: {group.cnicNtn} - Tax Year: {group.taxYear}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Merge Strategy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merge Strategy
            </label>
            <select
              value={mergeStrategy}
              onChange={(e) => setMergeStrategy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="keepMostRecent">Keep Most Recent Values</option>
              <option value="keepFirst">Keep First Record Values</option>
              <option value="manual">Manual Selection</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {mergeStrategy === 'keepMostRecent' && 'Uses values from the most recently processed record'}
              {mergeStrategy === 'keepFirst' && 'Uses values from the first record in the list'}
              {mergeStrategy === 'manual' && 'Manually select which record to keep'}
            </p>
          </div>

          {/* Manual Selection */}
          {mergeStrategy === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Record to Keep
              </label>
              <div className="space-y-2">
                {group.records.map((record, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedRecordIndex(idx)}
                    className={`p-4 border-2 rounded-lg cursor-pointer ${
                      selectedRecordIndex === idx
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <p className="font-medium">{record.status || 'Pending'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Income:</span>
                        <p className="font-medium">{record.incomeAmount || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Tax Paid:</span>
                        <p className="font-medium">{record.taxPaid || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Processed:</span>
                        <p className="font-medium">
                          {record.processedDate ? new Date(record.processedDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {record.notes && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">Notes:</span> {record.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-red-800 font-bold">Warning: This action cannot be undone</h4>
                <p className="text-red-700 text-sm mt-1">
                  Merging will combine {group.count} records into one. The duplicate records will be removed from the system.
                </p>
              </div>
            </div>
          </div>

          {/* Preview Merged Data */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Merged Record Preview</h4>
            <p className="text-xs text-gray-500 mb-3">
              This is how the merged record will look based on your selected strategy
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium">{group.name}</p>
              </div>
              <div>
                <span className="text-gray-600">CNIC/NTN:</span>
                <p className="font-medium">{group.cnicNtn}</p>
              </div>
              <div>
                <span className="text-gray-600">Tax Year:</span>
                <p className="font-medium">{group.taxYear}</p>
              </div>
              <div>
                <span className="text-gray-600">Records Merged:</span>
                <p className="font-medium">{group.count}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onMerge(group)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Merge Duplicates
          </button>
        </div>
      </div>
    </div>
  );
}
