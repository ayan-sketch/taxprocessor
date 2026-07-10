import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Reusable accordion card for each income source.
 *
 * Props:
 *  - title: string – human readable title (e.g., "Salary Income")
 *  - icon: React element – optional icon displayed before the title
 *  - isOpen: boolean – whether the section is expanded
 *  - onToggle: () => void – toggle handler for expand/collapse
 *  - hasIncome: boolean – whether this income type is enabled (checkbox)
 *  - onToggleIncome: (boolean) => void – handler for the enable checkbox
 *  - children: React node – form fields for the income type
 */
const IncomeSourceCard = ({
  title,
  icon,
  isOpen,
  onToggle,
  hasIncome,
  onToggleIncome,
  children,
}) => {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-600">{icon}</span>}
          <span className="font-medium text-gray-800">{title}</span>
        </div>
        <span className="text-gray-500">
          {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </span>
      </button>

      {/* Enable Checkbox */}
      <div className="px-4 py-2 bg-gray-50 flex items-center gap-2 border-t border-gray-200">
        <input
          type="checkbox"
          checked={hasIncome}
          onChange={(e) => onToggleIncome(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label className="text-sm text-gray-600 select-none">I have this income type</label>
      </div>

      {/* Body – collapsible */}
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export default IncomeSourceCard;
