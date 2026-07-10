/**
 * PDF Preview Modal Component
 * Displays PDF files in a modal with zoom and navigation controls
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Share2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

const PDFPreviewModal = ({ isOpen, onClose, pdfUrl, fileName, onDownload, onShare }) => {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
          className={`bg-gray-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col ${
            isFullscreen ? 'w-full h-full' : 'w-11/12 h-5/6 max-w-6xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white truncate max-w-md">
                {fileName}
              </h3>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4 text-gray-300" />
                </button>
                <span className="px-3 text-sm text-gray-300 min-w-[60px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4 text-gray-300" />
                </button>
              </div>

              {/* Action Buttons */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-gray-300" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-300" />
                )}
              </button>

              {onDownload && (
                <button
                  onClick={onDownload}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4 text-gray-300" />
                </button>
              )}

              {onShare && (
                <button
                  onClick={onShare}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Share PDF"
                >
                  <Share2 className="w-4 h-4 text-gray-300" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-gray-800 p-4">
            <div className="flex items-center justify-center min-h-full">
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0 rounded-lg"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  minHeight: '600px'
                }}
                title={fileName}
              />
            </div>
          </div>

          {/* Footer - Page Navigation (if needed) */}
          {/* <div className="flex items-center justify-center gap-4 p-3 border-t border-white/10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            </button>
            <span className="text-sm text-gray-300">
              Page {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div> */}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PDFPreviewModal;
