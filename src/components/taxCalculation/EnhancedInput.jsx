import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import Tooltip from './Tooltip';

const EnhancedInput = ({ 
  label, 
  tooltip, 
  value, 
  onChange, 
  type = 'text',
  placeholder,
  validation,
  required = false,
  example,
  autoFormat = false,
  className = ''
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!isTouched) return;

    if (required && !value) {
      setValidationError('This field is required');
      setIsValid(false);
      return;
    }

    if (validation && value) {
      const error = validation(value);
      setValidationError(error || '');
      setIsValid(!error && value);
    } else if (value) {
      setIsValid(true);
      setValidationError('');
    }
  }, [value, isTouched, required, validation]);

  const handleBlur = () => {
    setIsTouched(true);
  };

  const handleChange = (e) => {
    let newValue = e.target.value;

    // Auto-format for currency
    if (autoFormat && type === 'number') {
      // Remove non-numeric characters except decimal point
      newValue = newValue.replace(/[^\d.]/g, '');
    }

    onChange(newValue);
  };

  const formatDisplayValue = () => {
    if (autoFormat && type === 'number' && value && !document.activeElement?.id?.includes(label)) {
      // Format with commas when not focused
      return parseFloat(value).toLocaleString();
    }
    return value;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label with tooltip */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {tooltip && <Tooltip text={tooltip} />}
      </div>

      {/* Input field */}
      <div className="relative">
        <input
          type={type}
          value={formatDisplayValue()}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder || (example ? `e.g., ${example}` : '')}
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
            validationError && isTouched
              ? 'border-red-300 focus:ring-red-500/50 bg-red-50'
              : isValid
              ? 'border-green-300 focus:ring-green-500/50 bg-green-50/30'
              : 'border-gray-300 focus:ring-blue-500/50 bg-white'
          }`}
        />
        
        {/* Validation icons */}
        {isTouched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validationError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : isValid ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : null}
          </div>
        )}
      </div>

      {/* Error message */}
      {validationError && isTouched && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />
          {validationError}
        </p>
      )}

      {/* Example hint */}
      {example && !validationError && (
        <p className="text-xs text-gray-500">Example: {example}</p>
      )}
    </div>
  );
};

export default EnhancedInput;
