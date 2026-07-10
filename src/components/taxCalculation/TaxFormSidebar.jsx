import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

const TaxFormSidebar = ({ sections, currentStep, completedSections, onSectionClick }) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Form Sections
        </h3>
        
        <nav className="space-y-2">
          {sections.map((section, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSections.has(section.id);
            const isAccessible = index <= currentStep || isCompleted;

            return (
              <button
                key={section.id}
                onClick={() => isAccessible && onSectionClick(index)}
                disabled={!isAccessible}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                    : isCompleted
                    ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                    : isAccessible
                    ? 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                    : 'bg-gray-50 border border-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {/* Icon/Status */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm">{section.icon}</span>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{section.label}</div>
                  <div className="text-xs opacity-75">
                    {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Not Started'}
                  </div>
                </div>

                {/* Arrow */}
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Progress Summary */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900 mb-2">
            Overall Progress
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${(completedSections.size / sections.length) * 100}%`
                }}
              />
            </div>
            <div className="text-xs font-semibold text-blue-900">
              {completedSections.size}/{sections.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxFormSidebar;
