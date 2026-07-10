import React from 'react';
import { CheckCircle, Edit, FileText } from 'lucide-react';

const ReviewSubmitSection = ({ data, allData }) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          Review & Submit
        </h2>
        <p className="text-gray-600 mt-1">
          Review all information before submitting your tax return
        </p>
      </div>

      {/* Personal Info Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Name:</span>
            <span className="ml-2 font-medium">{allData.personalInfo.name}</span>
          </div>
          <div>
            <span className="text-gray-600">CNIC:</span>
            <span className="ml-2 font-medium">{allData.personalInfo.cnic}</span>
          </div>
          <div>
            <span className="text-gray-600">Tax Year:</span>
            <span className="ml-2 font-medium">{allData.personalInfo.taxYear}</span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <span className="ml-2 font-medium">{allData.personalInfo.residentialStatus}</span>
          </div>
        </div>
      </div>

      {/* Income Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Income Summary</h3>
        <div className="space-y-2 text-sm">
          {allData.salaryIncome.hasIncome && (
            <div className="flex justify-between">
              <span className="text-gray-600">Salary Income ({allData.salaryIncome.entries.length} entries)</span>
              <span className="font-medium">Reported</span>
            </div>
          )}
          {allData.businessIncome.hasIncome && (
            <div className="flex justify-between">
              <span className="text-gray-600">Business Income ({allData.businessIncome.entries.length} entries)</span>
              <span className="font-medium">Reported</span>
            </div>
          )}
          {allData.propertyIncome.hasIncome && (
            <div className="flex justify-between">
              <span className="text-gray-600">Property Income ({allData.propertyIncome.entries.length} entries)</span>
              <span className="font-medium">Reported</span>
            </div>
          )}
          {allData.capitalGains.hasIncome && (
            <div className="flex justify-between">
              <span className="text-gray-600">Capital Gains ({allData.capitalGains.entries.length} entries)</span>
              <span className="font-medium">Reported</span>
            </div>
          )}
          {allData.otherIncome.hasIncome && (
            <div className="flex justify-between">
              <span className="text-gray-600">Other Income ({allData.otherIncome.entries.length} entries)</span>
              <span className="font-medium">Reported</span>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-blue-900 text-lg mb-4">Financial Summary</h3>
        <div className="flex justify-between py-2">
          <span className="text-gray-700">Total Income</span>
          <span className="font-bold text-gray-900">Rs. {allData.taxComputation.totalIncome.toLocaleString()}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-700">Total Deductions</span>
          <span className="font-bold text-gray-900">Rs. {allData.taxComputation.totalDeductions.toLocaleString()}</span>
        </div>
        <div className="border-t-2 border-blue-300 pt-3 mt-3">
          <div className="flex justify-between">
            <span className="text-lg font-bold text-blue-900">Taxable Income</span>
            <span className="text-2xl font-bold text-blue-900">Rs. {allData.taxComputation.taxableIncome.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Declaration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Declaration</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="mb-3">
            I hereby declare that the information provided in this return is true and correct to the best of my knowledge and belief. 
            I understand that providing false information may result in penalties under the Income Tax Ordinance, 2001.
          </p>
          <p>
            I further declare that I have maintained proper records and documentation to support all claims made in this return.
          </p>
        </div>
      </div>

      {/* Submit Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-900">
            <strong>Ready to Submit:</strong> Once you click "Submit Return", your data will be saved. 
            You can review and edit it later if needed before final submission to FBR.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmitSection;
