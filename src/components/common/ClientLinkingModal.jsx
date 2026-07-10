/**
 * Client Linking Modal Component
 * Link tax returns to existing clients
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link, Search, User, CheckCircle, AlertCircle } from 'lucide-react';

const ClientLinkingModal = ({ isOpen, onClose, returnData, onLink }) => {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isLinking, setIsLinking] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);

  // Load clients from clientsData.json
  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  // Filter clients based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(client => 
        client.name?.toLowerCase().includes(query) ||
        client.cnic?.toLowerCase().includes(query) ||
        client.ntn?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      const response = await fetch('/src/clientsData.json');
      const data = await response.json();
      setClients(data.clients || []);
      setFilteredClients(data.clients || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
      setFilteredClients([]);
    }
  };

  const handleLinkClient = async () => {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }

    setIsLinking(true);
    try {
      await onLink(returnData.id, selectedClient.id);
      onClose();
      setSelectedClient(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Link error:', error);
      alert(`❌ Error linking client: ${error.message}`);
    } finally {
      setIsLinking(false);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
  };

  if (!isOpen || !returnData) return null;

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
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <Link className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Link to Client</h3>
                <p className="text-sm text-gray-400">{returnData.client_name} - {returnData.tax_year}</p>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Current Link Status */}
            {returnData.linked_client_id && (
              <div className="p-4 bg-green-600/10 border border-green-500/30 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-400 mb-1">Currently Linked</h4>
                  <p className="text-sm text-gray-300">
                    Client ID: {returnData.linked_client_id}
                  </p>
                  {returnData.linked_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Linked on: {new Date(returnData.linked_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, CNIC, NTN, or email..."
                className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Client List */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">
                Select Client ({filteredClients.length} found)
              </h4>
              
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No clients found</p>
                  {searchQuery && (
                    <p className="text-xs mt-1">Try a different search term</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className={`w-full p-4 rounded-xl border transition-all text-left ${
                        selectedClient?.id === client.id
                          ? 'bg-blue-600/20 border-blue-500'
                          : 'bg-black/20 border-white/10 hover:bg-black/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedClient?.id === client.id
                            ? 'bg-blue-600/30'
                            : 'bg-white/5'
                        }`}>
                          <User className={`w-5 h-5 ${
                            selectedClient?.id === client.id
                              ? 'text-blue-400'
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-white mb-1">{client.name}</h5>
                          <div className="space-y-0.5">
                            {client.cnic && (
                              <p className="text-xs text-gray-400">CNIC: {client.cnic}</p>
                            )}
                            {client.ntn && (
                              <p className="text-xs text-gray-400">NTN: {client.ntn}</p>
                            )}
                            {client.email && (
                              <p className="text-xs text-gray-400">Email: {client.email}</p>
                            )}
                            {client.phone && (
                              <p className="text-xs text-gray-400">Phone: {client.phone}</p>
                            )}
                          </div>
                        </div>
                        {selectedClient?.id === client.id && (
                          <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Message */}
            {!returnData.linked_client_id && (
              <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    Linking this return to a client will help you track all returns for that client in one place.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-black/30 text-gray-300 font-medium rounded-xl hover:bg-black/50 transition-all"
              disabled={isLinking}
            >
              Cancel
            </button>
            <button
              onClick={handleLinkClient}
              disabled={isLinking || !selectedClient}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLinking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  {returnData.linked_client_id ? 'Update Link' : 'Link Client'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientLinkingModal;
