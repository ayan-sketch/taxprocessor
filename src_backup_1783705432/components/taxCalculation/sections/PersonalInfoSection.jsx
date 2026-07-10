import React from 'react';
import { User, MapPin, Phone, Mail, CreditCard } from 'lucide-react';

const PersonalInfoSection = ({ data, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <User className="w-6 h-6 text-blue-600" />
          Personal Information
        </h2>
        <p className="text-gray-600 mt-1">
          Please provide your basic personal and contact information
        </p>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Name & CNIC Row */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNIC <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={data.cnic}
                onChange={(e) => handleChange('cnic', e.target.value)}
                placeholder="12345-1234567-1"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* NTN & Tax Year Row */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NTN (National Tax Number)
            </label>
            <input
              type="text"
              value={data.ntn}
              onChange={(e) => handleChange('ntn', e.target.value)}
              placeholder="Enter NTN if available"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.taxYear}
              onChange={(e) => handleChange('taxYear', e.target.value)}
              placeholder="2026"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>
        </div>

        {/* Residential Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Residential Status <span className="text-red-500">*</span>
          </label>
          <select
            value={data.residentialStatus}
            onChange={(e) => handleChange('residentialStatus', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="Resident">Resident Individual</option>
            <option value="Non-Resident">Non-Resident Individual</option>
          </select>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Residential Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
            <textarea
              value={data.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter your complete residential address"
              rows="3"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              required
            />
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Enter your city"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            required
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={data.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All fields marked with <span className="text-red-500">*</span> are required. 
          Please ensure your CNIC is in the correct format (e.g., 12345-1234567-1).
        </p>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
