import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({ text, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help inline-flex items-center"
      >
        {children || <HelpCircle className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors" />}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${positionClasses[position]} z-50 w-64 pointer-events-none`}
          >
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700">
              {text}
              <div className={`absolute w-2 h-2 bg-gray-900 border-gray-700 transform rotate-45 
                ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-r border-b' : ''}
                ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l border-t' : ''}
                ${position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r' : ''}
                ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l' : ''}
              `} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
