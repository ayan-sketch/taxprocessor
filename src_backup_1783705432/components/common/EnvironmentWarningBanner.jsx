import React from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Environment Warning Banner
 * Shows a prominent warning when app is running in browser mode instead of Electron
 */
const EnvironmentWarningBanner = ({ onDismiss }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-start gap-4">
            {/* Warning Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold">⚠️ Browser Mode Detected</h3>
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">
                  Limited Functionality
                </span>
              </div>
              
              <p className="text-sm text-white/90 mb-3">
                You're running the app in browser mode. Excel integration and file system features are disabled.
              </p>

              {/* Features List */}
              <div className="bg-white/10 rounded-lg p-3 mb-3">
                <p className="text-xs font-semibold mb-2">🚫 Disabled Features:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    <span>Excel file opening</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    <span>Client folder creation</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    <span>File system operations</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    <span>Notice file organization</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold text-sm">
                  <ExternalLink className="w-4 h-4" />
                  <span>Run: start-electron-only.bat</span>
                </div>
                <button
                  onClick={() => {
                    // Copy command to clipboard
                    navigator.clipboard.writeText('start-electron-only.bat');
                    alert('Command copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold text-sm transition-all"
                >
                  Copy Command
                </button>
              </div>
            </div>

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-all"
                title="Dismiss (warning will reappear on refresh)"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnvironmentWarningBanner;
