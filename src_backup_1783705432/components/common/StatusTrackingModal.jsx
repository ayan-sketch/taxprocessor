/**
 * Status Tracking Component
 * Track and manage tax return status with history
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle, AlertCircle, XCircle, Calendar } from 'lucide-react';

const StatusTrackingModal = ({ isOpen, onClose, returnData, onUpdateStatus }) => {
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const statuses = [
    { value: 'Processed', label: 'Processed', color: 'blue', icon: CheckCircle },
    { value: 'Filed', label: 'Filed', color: 'green', icon: CheckCircle },
    { value: 'Under Review', label: 'Under Review', color: 'yellow', icon: Clock },
    { value: 'Approved', label: 'Approved', color: 'emerald', icon: CheckCircle },
    { value: 'Rejected', label: 'Rejected', color: 'red', icon: XCircle },
    { value: 'Pending Documents', label: 'Pending Documents', color: 'orange', icon: AlertCircle },
  ];

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      alert('Please select a status');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateStatus({
        status: newStatus,
        notes: notes,
        deadline: deadline,
        timestamp: new Date().toISOString()
      });
      
      setNewStatus('');
      setNotes('');
      setDeadline('');
      onClose();
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'gray';
  };

  const getStatusIcon = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.icon : Clock;
  };

  if (!isOpen || !returnData) return null;

  const StatusIcon = getStatusIcon(returnData.status);
  const statusColor = getStatusColor(returnData.status);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-${statusColor}-600/20 rounded-xl`}>
                <StatusIcon className={`w-6 h-6 text-${statusColor}-400`} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Status Tracking</h3>
                <p className="text-sm text-gray-400">{returnData.client_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Current Status */}
            <div className="p-4 bg-black/20 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Current Status</span>
                <span className={`px-3 py-1 bg-${statusColor}-600/20 text-${statusColor}-400 text-sm font-medium rounded-lg border border-${statusColor}-500/30`}>
                  {returnData.status}
                </span>
              </div>
              {returnData.processed_at && (
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(returnData.processed_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* Status History (if available) */}
            {returnData.status_history && returnData.status_history.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Status History</h4>
                <div className="space-y-2">
                  {returnData.status_history.map((history, index) => {
                    const HistoryIcon = getStatusIcon(history.status);
                    const historyColor = getStatusColor(history.status);
                    
                    return (
                      <div
                        key={index}
                        className="p-3 bg-black/20 border border-white/10 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <HistoryIcon className={`w-4 h-4 text-${historyColor}-400 mt-0.5`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium text-${historyColor}-400`}>
                                {history.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(history.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {history.notes && (
                              <p className="text-xs text-gray-400">{history.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Update Status Form */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white">Update Status</h4>
              
              {/* Status Selection */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  New Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {statuses.map((status) => {
                    const Icon = status.icon;
                    return (
                      <button
                        key={status.value}
                        onClick={() => setNewStatus(status.value)}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${
                          newStatus === status.value
                            ? `bg-${status.color}-600/20 border-${status.color}-500 text-${status.color}-400`
                            : 'bg-black/20 border-white/10 text-gray-400 hover:bg-black/30'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any relevant notes..."
                  rows={3}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-black/30 text-gray-300 font-medium rounded-xl hover:bg-black/50 transition-all"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={isSaving || !newStatus}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Update Status
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StatusTrackingModal;
