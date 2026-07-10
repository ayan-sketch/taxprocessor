import React from 'react';
import { Briefcase, Plus, Trash2, DollarSign } from 'lucide-react';
import EnhancedInput from '../EnhancedInput';
import Tooltip from '../Tooltip';

const SalaryIncomeSection = ({ data, onUpdate }) => {
  const handleToggleIncome = (value) => {
    onUpdate({
      ...data,
      hasIncome: value,
      entries: value ? data.entries : []
    });
  };

  const addEntry = () => {
    onUpdate({
      ...data,
      entries: [
        ...data.entries,
        {
          id: Date.now(),
          employerName: '',
          employerNTN: '',
          grossSalary: '',
          allowances: '',
          taxDeducted: '',
          netSalary: ''
        }
      ]
    });
  };

  const removeEntry = (id) => {
    onUpdate({
      ...data,
      entries: data.entries.filter(entry => entry.id !== id)
    });
  };

  const updateEntry = (id, field, value) => {
    onUpdate({
      ...data,
      entries: data.entries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    });
  };

  const calculateNetSalary = (entry) => {
    const gross = parseFloat(entry.grossSalary) || 0;
    const allowances = parseFloat(entry.allowances) || 0;
    const taxDeducted = parseFloat(entry.taxDeducted) || 0;
    return gross + allowances - taxDeducted;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Salary Income
          </h2>
          <Tooltip text="Report all income received from employment including basic salary, allowances, bonuses, and any other compensation during the tax year." />
        </div>
        <p className="text-gray-600 mt-1">
          Provide details of income from salary/employment during the tax year
        </p>
      </div>

      {/* Toggle Income */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hasIncome}
            onChange={(e) => handleToggleIncome(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            I have salary income to report
          </span>
        </label>
      </div>

      {/* Salary Entries */}
      {data.hasIncome && (
        <div className="space-y-4">
          {data.entries.map((entry, index) => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              {/* Entry Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-semibold text-gray-900">
                  Employer #{index + 1}
                </h3>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Employer Details */}
              <div className="grid grid-cols-2 gap-4">
                <EnhancedInput
                  label="Employer Name"
                  tooltip="Enter the legal name of your employer as shown on your salary slip"
                  value={entry.employerName}
                  onChange={(value) => updateEntry(entry.id, 'employerName', value)}
                  placeholder="Enter employer name"
                  required
                  example="ABC Corporation (Pvt) Ltd"
                />

                <EnhancedInput
                  label="Employer NTN"
                  tooltip="National Tax Number of your employer (7 digits). This should be printed on your salary slip."
                  value={entry.employerNTN}
                  onChange={(value) => updateEntry(entry.id, 'employerNTN', value)}
                  placeholder="Enter employer NTN"
                  example="1234567"
                  validation={(value) => {
                    if (value && !/^\d{7}$/.test(value)) {
                      return 'NTN must be exactly 7 digits';
                    }
                    return null;
                  }}
                />
              </div>

              {/* Income Details */}
              <div className="grid grid-cols-2 gap-4">
                <EnhancedInput
                  label="Gross Salary (Annual)"
                  tooltip="Total annual salary before any deductions including basic pay, allowances, bonuses, and other compensation"
                  value={entry.grossSalary}
                  onChange={(value) => updateEntry(entry.id, 'grossSalary', value)}
                  type="number"
                  placeholder="0.00"
                  required
                  example="1200000"
                  autoFormat={true}
                  validation={(value) => {
                    if (value && parseFloat(value) <= 0) {
                      return 'Salary must be greater than 0';
                    }
                    return null;
                  }}
                />

                <EnhancedInput
                  label="Allowances (if any)"
                  tooltip="Additional allowances such as house rent, medical, transport, etc. that are not included in gross salary"
                  value={entry.allowances}
                  onChange={(value) => updateEntry(entry.id, 'allowances', value)}
                  type="number"
                  placeholder="0.00"
                  example="50000"
                  autoFormat={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <EnhancedInput
                  label="Tax Deducted at Source"
                  tooltip="Amount of income tax already deducted by your employer from your salary during the year"
                  value={entry.taxDeducted}
                  onChange={(value) => updateEntry(entry.id, 'taxDeducted', value)}
                  type="number"
                  placeholder="0.00"
                  example="15000"
                  autoFormat={true}
                />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Net Salary (Calculated)
                    </label>
                    <Tooltip text="Automatically calculated as: Gross Salary + Allowances - Tax Deducted" />
                  </div>
                  <div className="px-4 py-2.5 bg-green-50 border border-green-300 rounded-lg text-green-900 font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Rs. {calculateNetSalary(entry).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Entry Button */}
          <button
            onClick={addEntry}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Another Employer
          </button>
        </div>
      )}

      {/* Summary */}
      {data.hasIncome && data.entries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Total Salary Income:</span>
            <span className="text-lg font-bold text-blue-900">
              Rs. {data.entries.reduce((sum, entry) => sum + calculateNetSalary(entry), 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryIncomeSection;
