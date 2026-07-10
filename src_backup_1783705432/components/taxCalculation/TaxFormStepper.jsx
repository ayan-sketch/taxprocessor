import React from 'react';
import { Check } from 'lucide-react';

const TaxFormStepper = ({ sections, currentStep, completedSections, onStepClick }) => {
  return (
    <div className="flex items-center justify-between max-w-6xl mx-auto">
      {sections.map((section, index) => {
        const isActive = index === currentStep;
        const isCompleted = completedSections.has(section.id);
        const isAccessible = index <= currentStep || isCompleted;

        return (
          <React.Fragment key={section.id}>
            <div
              onClick={() => isAccessible && onStepClick(index)}
              className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${
                isAccessible ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              {/* Step Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-lg">{section.icon}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="text-center">
                <div
                  className={`text-xs font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {section.label}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < sections.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded transition-all ${
                  completedSections.has(section.id)
                    ? 'bg-green-500'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default TaxFormStepper;
