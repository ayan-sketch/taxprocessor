import React from 'react';
import { User, CreditCard, Calendar, Briefcase } from 'lucide-react';

const TaxpayerInfoCard = ({ name, cnic, ntn, taxYear, personType = 'Individual' }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Name */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Client Name</div>
            <div className="text-sm font-semibold text-gray-900 truncate max-w-[180px]" title={name}>
              {name || 'N/A'}
            </div>
          </div>
        </div>

        {/* CNIC / NTN */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">CNIC / NTN</div>
            <div className="text-sm font-semibold text-gray-900">
              {cnic || ntn || 'N/A'}
            </div>
          </div>
        </div>

        {/* Tax Year */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Tax Year</div>
            <div className="text-sm font-semibold text-gray-900">
              {taxYear || 'N/A'}
            </div>
          </div>
        </div>

        {/* Person Type */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Person Type</div>
            <div className="text-sm font-semibold text-gray-900">
              {personType}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxpayerInfoCard;
