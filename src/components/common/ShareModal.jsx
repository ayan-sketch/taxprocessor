/**
 * Share Modal Component
 * Allows sharing PDFs via Email and WhatsApp
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, MessageCircle, Send, Loader, CheckCircle } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, selectedReturns, onShare }) => {
  const [shareMethod, setShareMethod] = useState('email'); // 'email' or 'whatsapp'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  const handleShare = async () => {
    if (shareMethod === 'email' && !email) {
      alert('Please enter an email address');
      return;
    }
    if (shareMethod === 'whatsapp' && !phone) {
      alert('Please enter a phone number');
      return;
    }

    setIsSharing(true);
    setShareStatus(null);

    try {
      await onShare({
        method: shareMethod,
        email: email,
        phone: phone,
        message: message,
        returns: selectedReturns
      });

      setShareStatus('success');
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error) {
      setShareStatus('error');
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPhone('');
    setMessage('');
    setShareStatus(null);
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
          className="bg-gray-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="text-xl font-semibold text-white">
              Share Tax Returns
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Selected Returns Info */}
            <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
              <p className="text-sm text-blue-400">
                {selectedReturns.length} {selectedReturns.length === 1 ? 'return' : 'returns'} selected
              </p>
            </div>

            {/* Share Method Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Share via</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShareMethod('email')}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                    shareMethod === 'email'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Email</span>
                </button>
                <button
                  onClick={() => setShareMethod('whatsapp')}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                    shareMethod === 'whatsapp'
                      ? 'bg-green-600/20 border-green-500 text-green-400'
                      : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Email Input */}
            {shareMethod === 'email' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            {/* WhatsApp Phone Input */}
            {shareMethod === 'whatsapp' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                />
                <p className="text-xs text-gray-500">Include country code (e.g., +92)</p>
              </div>
            )}

            {/* Message Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message..."
                rows={3}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Status Messages */}
            {shareStatus === 'success' && (
              <div className="p-4 bg-green-600/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-sm text-green-400">Successfully shared!</p>
              </div>
            )}

            {shareStatus === 'error' && (
              <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400">Failed to share. Please try again.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-black/30 text-gray-300 font-medium rounded-xl hover:bg-black/50 transition-all"
              disabled={isSharing}
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing || (!email && shareMethod === 'email') || (!phone && shareMethod === 'whatsapp')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Share
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
