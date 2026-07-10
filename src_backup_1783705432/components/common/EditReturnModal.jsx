/**
 * Edit Return Modal Component
 * Allows manual editing and validation of extracted tax return data
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertTriangle, CheckCircle, Edit3 } from 'lucide-react';

const EditReturnModal = ({ isOpen, onClose, returnData, onSave }) => {
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (returnData) {
      setFormData({
        client_name: returnData.client_name || '',
        cnic: returnData.cnic || '',
        ntn: returnData.ntn || '',
        tax_year: returnData.tax_year || '',
        total_income: returnData.total_income || '',
        taxable_income: returnData.taxable_income || '',
        tax_chargeable: returnData.tax_chargeable || '',
        tax_paid: returnData.tax_paid || '',
        refund_amount: returnData.refund_amount || '',
        refund_section: returnData.refund_section || '',
        status: returnData.status || 'Processed',
      });
      validateData(returnData);
    }
  }, [returnData]);

  const validateData = (data) => {
    const errors = {};
    
    if (!data.client_name || data.client_name === 'Unknown') {
      errors.client_name = 'Client name is missing or incomplete';
    }
    
    if (!data.cnic && !data.ntn) {
      errors.identifier = 'Either CNIC or NTN is required';
    }
    
    if (!data.tax_year || data.tax_year === 'Unknown') {
      errors.tax_year = 'Tax year is missing';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateData(formData)) {
      alert('Please fix validation errors before saving');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...returnData,
        ...formData
      });
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const getConfidenceScore = (field, value) => {
    if (!value || value === 'Unknown' || value === '') return 0;
    
    // Simple confidence scoring logic
    if (field === 'client_name') {
      if (value.length < 5) return 30;
      if (value.includes('Registration') || value.includes('Unknown')) return 40;
      return 95;
    }
    
    if (field === 'cnic') {
      return /^\d{5}-\d{7}-\d{1}$/.test(value) ? 100 : 50;
    }
    
    if (field === 'ntn') {
      return /^\d{7,8}(-\d)?$/.test(value) ? 100 : 50;
    }
    
    if (field === 'tax_year') {
      const year = parseInt(value);
      return (year >= 2000 && year <= 2030) ? 100 : 30;
    }
    
    if (field === 'total_income' || field === 'taxable_income' || field === 'tax_chargeable' || field === 'tax_paid' || field === 'refund_amount') {
      return value && parseFloat(value) > 0 ? 90 : 0;
    }
    
    return 70;
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isOpen) return null;

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
          className="bg-gray-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">Edit Tax Return</h3>
                <p className="text-sm text-gray-400">Review and correct extracted data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Validation Warnings */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mx-6 mt-6 p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2">Data Quality Issues</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Client Name */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Client Name</label>
                <span className={`text-xs font-medium ${getConfidenceColor(getConfidenceScore('client_name', formData.client_name))}`}>
                  Confidence: {getConfidenceScore('client_name', formData.client_name)}%
                </span>
              </div>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => handleChange('client_name', e.target.value)}
                className={`w-full px-4 py-3 bg-black/30 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ${
                  validationErrors.client_name ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="Enter client name"
              />
            </div>

            {/* CNIC */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">CNIC</label>
                <span className={`text-xs font-medium ${getConfidenceColor(getConfidenceScore('cnic', formData.cnic))}`}>
                  Confidence: {getConfidenceScore('cnic', formData.cnic)}%
                </span>
              </div>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) => handleChange('cnic', e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="12345-6789012-3"
              />
            </div>

            {/* NTN */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">NTN</label>
                <span className={`text-xs font-medium ${getConfidenceColor(getConfidenceScore('ntn', formData.ntn))}`}>
                  Confidence: {getConfidenceScore('ntn', formData.ntn)}%
                </span>
              </div>
              <input
                type="text"
                value={formData.ntn}
                onChange={(e) => handleChange('ntn', e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="1234567-8"
              />
            </div>

            {/* Tax Year */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Tax Year</label>
                <span className={`text-xs font-medium ${getConfidenceColor(getConfidenceScore('tax_year', formData.tax_year))}`}>
                  Confidence: {getConfidenceScore('tax_year', formData.tax_year)}%
                </span>
              </div>
              <input
                type="text"
                value={formData.tax_year}
                onChange={(e) => handleChange('tax_year', e.target.value)}
                className={`w-full px-4 py-3 bg-black/30 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ${
                  validationErrors.tax_year ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="2024"
              />
            </div>

            {/* Financial Data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Total Income</label>
                  <span className={`text-xs font-medium ${getConfidenceColor(getConfidenceScore('total_income', formData.total_income))}`}>
                    {getConfidenceScore('total_income', formData.total_income)}%
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.total_income}
                  onChange={(e) => handleChange('total_income', e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Taxable Income</label>
                  <span className={`text-xs font-medium ${getConfidenceColor(getConfidenceScore('taxable_income', formData.taxable_income))}`}>
                    {getConfidenceScore('taxable_income', formData.taxable_income)}%
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.taxable_income}
                  onChange={(e) => handleChange('taxable_income', e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Tax Chargeable</label>
                  <span className={`text-xs font-medium ${getConfidenceColor(getConfidenceScore('tax_chargeable', formData.tax_chargeable))}`}>
                    {getConfidenceScore('tax_chargeable', formData.tax_chargeable)}%
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.tax_chargeable}
                  onChange={(e) => handleChange('tax_chargeable', e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Refund Amount</label>
                  <span className={`text-xs font-medium ${getConfidenceColor(getConfidenceScore('refund_amount', formData.refund_amount))}`}>
                    {getConfidenceScore('refund_amount', formData.refund_amount)}%
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.refund_amount}
                  onChange={(e) => handleChange('refund_amount', e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Refund Section */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Refund Section</label>
              <input
                type="text"
                value={formData.refund_section}
                onChange={(e) => handleChange('refund_section', e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Section 147"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="Processed">Processed</option>
                <option value="Filed">Filed</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
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
              onClick={handleSave}
              disabled={isSaving || Object.keys(validationErrors).length > 0}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditReturnModal;
