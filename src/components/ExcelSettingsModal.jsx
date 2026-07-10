import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FolderOpen, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Save,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { 
  getExcelBasePath, 
  setExcelBasePath, 
  resetExcelPath,
  getExcelPathLastUpdated,
  getAvailableWorkbooks,
  validateExcelPath
} from '../utils/excelConfig';

const ExcelSettingsModal = ({ isOpen, onClose }) => {
  const [excelPath, setExcelPath] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [availableWorkbooks, setAvailableWorkbooks] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadCurrentSettings();
    }
  }, [isOpen]);

  const loadCurrentSettings = () => {
    const currentPath = getExcelBasePath();
    const updated = getExcelPathLastUpdated();
    const workbooks = getAvailableWorkbooks();
    
    setExcelPath(currentPath);
    setLastUpdated(updated);
    setAvailableWorkbooks(workbooks);
    setValidationStatus(null);
  };

  const handleBrowseFolder = async () => {
    try {
      if (typeof window !== 'undefined' && window.require) {
        const { dialog } = window.require('electron').remote || window.require('@electron/remote');
        
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory'],
          title: 'Select Excel Workbooks Folder',
          defaultPath: excelPath
        });

        if (!result.canceled && result.filePaths.length > 0) {
          setExcelPath(result.filePaths[0]);
          setValidationStatus(null);
        }
      }
    } catch (error) {
      console.error('Error browsing folder:', error);
      alert('Error opening folder browser. Please enter path manually.');
    }
  };

  const handleValidatePath = async () => {
    setIsValidating(true);
    setValidationStatus(null);

    try {
      const isValid = await validateExcelPath(excelPath);
      
      if (isValid) {
        setValidationStatus({
          type: 'success',
          message: 'Path is valid and accessible'
        });
      } else {
        setValidationStatus({
          type: 'error',
          message: 'Path not found or not accessible'
        });
      }
    } catch (error) {
      setValidationStatus({
        type: 'error',
        message: `Validation error: ${error.message}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Validate before saving
      const isValid = await validateExcelPath(excelPath);
      
      if (!isValid) {
        setValidationStatus({
          type: 'error',
          message: 'Cannot save: Path is not valid'
        });
        setIsSaving(false);
        return;
      }

      // Save the path
      const success = setExcelBasePath(excelPath);
      
      if (success) {
        setValidationStatus({
          type: 'success',
          message: 'Excel path saved successfully!'
        });
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setValidationStatus({
          type: 'error',
          message: 'Failed to save Excel path'
        });
      }
    } catch (error) {
      setValidationStatus({
        type: 'error',
        message: `Save error: ${error.message}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset to default Excel path? This will restore the original path.')) {
      resetExcelPath();
      loadCurrentSettings();
      setValidationStatus({
        type: 'success',
        message: 'Path reset to default'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Excel Settings</h2>
                <p className="text-blue-100 text-sm">Configure Excel workbook paths</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Current Path Section */}
            <div className="mb-6">
              <label className="block text-gray-300 font-semibold mb-2">
                Excel Workbooks Folder Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={excelPath}
                  onChange={(e) => setExcelPath(e.target.value)}
                  className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="C:\Path\To\Excel\Workbooks"
                />
                <button
                  onClick={handleBrowseFolder}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FolderOpen className="w-5 h-5" />
                  Browse
                </button>
              </div>
              {lastUpdated && (
                <p className="text-gray-400 text-sm mt-2">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>

            {/* Validation Status */}
            {validationStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                  validationStatus.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/50'
                    : 'bg-red-500/20 border border-red-500/50'
                }`}
              >
                {validationStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={validationStatus.type === 'success' ? 'text-green-300' : 'text-red-300'}>
                  {validationStatus.message}
                </span>
              </motion.div>
            )}

            {/* Available Workbooks */}
            <div className="mb-6">
              <h3 className="text-gray-300 font-semibold mb-3 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Available Workbooks ({availableWorkbooks.length})
              </h3>
              <div className="bg-gray-700/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {availableWorkbooks.map((workbook) => (
                    <div
                      key={workbook.key}
                      className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium">{workbook.label}</p>
                          <p className="text-gray-400 text-sm">{workbook.description}</p>
                          <p className="text-gray-500 text-xs mt-1 font-mono">{workbook.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">ℹ️ Information</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• This folder should contain all your Excel tax return workbooks</li>
                <li>• The path is saved locally and can be changed anytime</li>
                <li>• Click "Test Connection" to verify the path is accessible</li>
                <li>• Use "Reset to Default" to restore the original path</li>
              </ul>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-750 p-6 flex items-center justify-between border-t border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={handleValidatePath}
                disabled={isValidating}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
                {isValidating ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExcelSettingsModal;
