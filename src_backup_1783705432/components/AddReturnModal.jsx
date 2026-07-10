import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, FileText, Calendar, CheckCircle, AlertCircle, Loader, Search } from 'lucide-react';
import { getTemplateRecommendation } from '../utils/excelTemplateSelector';
import { isElectron, hasElectronAPI, logEnvironmentInfo } from '../utils/environmentDetection';
import AddClientForm from './AddClientForm';

// Add Return Modal with client validation
const AddReturnModal = ({ 
  isOpen, 
  onClose, 
  clients, 
  onProceed,
  onClientAdded // Callback when new client is added
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cnic, setCnic] = useState('');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear().toString());
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [clientRootDirectory, setClientRootDirectory] = useState('D:\\Tax Automation Clients');
  const [templateRecommendation, setTemplateRecommendation] = useState(null);
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [showAddClientConfirm, setShowAddClientConfirm] = useState(false);

  // Load default client root directory on mount
  useEffect(() => {
    if (isOpen) {
      // Log environment info for debugging
      logEnvironmentInfo();
      
      if (isElectron() && hasElectronAPI('getDefaultClientRoot')) {
        window.electronAPI.getDefaultClientRoot().then(result => {
          if (result.success && result.rootDirectory) {
            setClientRootDirectory(result.rootDirectory);
          }
        }).catch(err => {
          console.error('Failed to get default client root:', err);
        });
      }
    }
  }, [isOpen]);

  // Filter clients based on unified search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const queryWithoutDashes = query.replace(/-/g, '');

    const matches = clients.filter(client => {
      const clientNameMatch = (client.name || '').toLowerCase().includes(query);
      const clientCnicMatch = (client.cnic || '').replace(/-/g, '').includes(queryWithoutDashes);
      const clientNtnMatch = (client.ntn || '').replace(/-/g, '').includes(queryWithoutDashes);

      return clientNameMatch || clientCnicMatch || clientNtnMatch;
    }).slice(0, 5);

    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [searchQuery, clients]);

  const handleSelectClient = (client) => {
    setSearchQuery(client.name);
    setCnic(client.cnic || client.ntn || '');
    setSelectedClient(client);
    setShowSuggestions(false);
    setError('');
    
    // Get template recommendation based on client data
    const recommendation = getTemplateRecommendation(client);
    setTemplateRecommendation(recommendation);
    console.log('Template recommendation:', recommendation);
  };

  // Check if selected client is valid
  const checkClientExists = () => {
    if (!selectedClient) {
      // Try to find client from search query
      const query = searchQuery.trim().toLowerCase();
      const queryWithoutDashes = query.replace(/-/g, '');
      
      return clients.find(client => {
        const nameMatch = (client.name || '').toLowerCase() === query;
        const cnicMatch = (client.cnic || '').replace(/-/g, '') === queryWithoutDashes;
        const ntnMatch = (client.ntn || '').replace(/-/g, '') === queryWithoutDashes;
        return nameMatch || cnicMatch || ntnMatch;
      });
    }
    return selectedClient;
  };

  const handleProceed = async () => {
    // Validation
    if (!searchQuery.trim() && !selectedClient) {
      setError('Please search and select a client');
      return;
    }
    if (!taxYear.trim()) {
      setError('Please enter tax year');
      return;
    }

    // Check if client exists
    const existingClient = checkClientExists();
    
    if (existingClient) {
      // Client exists, proceed directly to tax calculation
      proceedWithoutElectron(existingClient);
    } else {
      // Client doesn't exist, show confirmation popup
      setShowAddClientConfirm(true);
    }
  };

  const proceedWithoutElectron = (clientData = null) => {
    const client = clientData || selectedClient;
    // Browser mode - just pass the data to parent component
    if (onProceed) {
      onProceed({
        clientName: client?.name || '',
        cnic: client?.cnic || client?.ntn || '',
        taxYear: taxYear.trim(),
        clientData: client,
        browserMode: true
      });
    }
    handleClose();
  };

  const proceedWithReturn = async (clientData = null) => {
    setIsProcessing(true);
    setError('');

    try {
      // Electron mode - full folder creation workflow
      if (!isElectron()) {
        // Fallback to browser mode if somehow called without Electron
        proceedWithoutElectron(clientData);
        return;
      }

      if (!hasElectronAPI('createClientFolderAndOpenExcel')) {
        setError('⚠️ Client folder creation feature not available. Please restart the application using start-electron.bat.');
        setIsProcessing(false);
        return;
      }

      // Get template recommendation if not already set
      let recommendation = templateRecommendation;
      if (!recommendation) {
        recommendation = getTemplateRecommendation(clientData || selectedClient);
        console.log('Template recommendation:', recommendation);
      }

      console.log('Creating client folder and opening Excel...');
      console.log('CNIC:', cnic.trim());
      console.log('Client Name:', clientName.trim());
      console.log('Tax Year:', taxYear.trim());
      console.log('Template Path:', recommendation.templatePath);
      console.log('Root Directory:', clientRootDirectory);

      // Call Electron IPC to create folder and open Excel
      const result = await window.electronAPI.createClientFolderAndOpenExcel(
        cnic.trim(),
        clientName.trim(),
        taxYear.trim(),
        recommendation.templatePath,
        clientRootDirectory
      );

      console.log('Electron result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create folder and open Excel');
      }

      // Success - call onProceed with the result
      if (onProceed) {
        await onProceed({
          clientName: clientName.trim(),
          cnic: cnic.trim(),
          taxYear: taxYear.trim(),
          clientData: clientData || selectedClient,
          clientFolder: result.clientFolder,
          excelFilePath: result.excelFilePath,
          templateUsed: recommendation.workbook.label,
          folderExists: result.folderExists,
          fileExists: result.fileExists
        });
      }

      // Close modal on success
      handleClose();

    } catch (err) {
      console.error('Error in proceedWithReturn:', err);
      setError(err.message || 'Failed to open Excel');
      setIsProcessing(false);
    }
  };

  const handleBrowseDirectory = async () => {
    try {
      if (!isElectron() || !hasElectronAPI('selectClientRootDirectory')) {
        setError('Directory selection requires Electron desktop environment. Please run start-electron.bat.');
        return;
      }

      const result = await window.electronAPI.selectClientRootDirectory();
      
      if (result.success && result.rootDirectory) {
        setClientRootDirectory(result.rootDirectory);
        setError('');
      }
    } catch (err) {
      console.error('Error selecting directory:', err);
      setError('Failed to select directory');
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSearchQuery('');
      setTaxYear(new Date().getFullYear().toString());
      setSelectedClient(null);
      setError('');
      setShowSuggestions(false);
      setTemplateRecommendation(null);
      setShowAddClientConfirm(false);
      setShowAddClientForm(false);
      onClose();
    }
  };

  const handleConfirmAddClient = () => {
    setShowAddClientConfirm(false);
    // Always use web-based workflow (no Excel/Electron)
    proceedWithoutElectron(null);
  };

  const handleCancelAddClient = () => {
    setShowAddClientConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Add Client Confirmation Popup */}
        {showAddClientConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-[60] w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-white/10 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-600/20 rounded-full">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Client Not Found</h3>
                <p className="text-sm text-gray-300 mb-4">
                  The client <strong className="text-white">{clientName}</strong> with CNIC/NTN <strong className="text-white">{cnic}</strong> does not exist in the system.
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Do you want to add this as a new client and proceed with creating the return?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelAddClient}
                    className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAddClient}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium transition-all"
                  >
                    Yes, Add Client
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Add New Return</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Client Name Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Client Name
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isProcessing}
                placeholder="Enter client name..."
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {suggestions.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                    >
                      <div className="font-medium text-white">{client.name}</div>
                      <div className="text-sm text-gray-400">
                        {client.cnic || client.ntn} • {client.person || 'Individual'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CNIC/NTN Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CNIC / NTN
              </label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                disabled={isProcessing}
                placeholder="Enter CNIC or NTN..."
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
              />
            </div>

            {/* Tax Year Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tax Year
              </label>
              <input
                type="text"
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                disabled={isProcessing}
                placeholder="2026"
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="text-sm text-red-400">{error}</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-black/20 border-t border-white/10 flex gap-3">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Proceed
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddReturnModal;
