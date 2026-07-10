import React from 'react';
import { Receipt, Plus, Trash2, DollarSign } from 'lucide-react';

const DeductionsSection = ({ data, onUpdate }) => {
  const addInvestment = () => {
    onUpdate({
      ...data,
      investments: [
        ...data.investments,
        {
          id: Date.now(),
          type: '',
          description: '',
          amount: ''
        }
      ]
    });
  };

  const removeInvestment = (id) => {
    onUpdate({
      ...data,
      investments: data.investments.filter(item => item.id !== id)
    });
  };

  const updateInvestment = (id, field, value) => {
    onUpdate({
      ...data,
      investments: data.investments.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const addDonation = () => {
    onUpdate({
      ...data,
      donations: [
        ...data.donations,
        {
          id: Date.now(),
          organizationName: '',
          organizationNTN: '',
          amount: '',
          receiptNumber: ''
        }
      ]
    });
  };

  const removeDonation = (id) => {
    onUpdate({
      ...data,
      donations: data.donations.filter(item => item.id !== id)
    });
  };

  const updateDonation = (id, field, value) => {
    onUpdate({
      ...data,
      donations: data.donations.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const handleZakatChange = (value) => {
    onUpdate({
      ...data,
      zakat: value
    });
  };

  const getTotalDeductions = () => {
    const investments = data.investments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const donations = data.donations.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const zakat = parseFloat(data.zakat) || 0;
    return investments + donations + zakat;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Receipt className="w-6 h-6 text-blue-600" />
          Deductions & Allowances
        </h2>
        <p className="text-gray-600 mt-1">
          Claim deductions for investments, donations, and other allowed expenses
        </p>
      </div>

      {/* Investments Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-semibold text-gray-900">Investment in Approved Funds</h3>
          <button
            onClick={addInvestment}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Investment
          </button>
        </div>

        {data.investments.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No investments added. Click "Add Investment" to start.
          </div>
        ) : (
          <div className="space-y-3">
            {data.investments.map((investment, index) => (
              <div key={investment.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <select
                      value={investment.type}
                      onChange={(e) => updateInvestment(investment.id, 'type', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="Life Insurance">Life Insurance Premium</option>
                      <option value="Pension Fund">Pension Fund</option>
                      <option value="Unit Trust">Unit Trust Certificates</option>
                      <option value="Provident Fund">Provident Fund</option>
                      <option value="Other">Other Approved Investment</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={investment.description}
                      onChange={(e) => updateInvestment(investment.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={investment.amount}
                      onChange={(e) => updateInvestment(investment.id, 'amount', e.target.value)}
                      placeholder="Amount"
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeInvestment(investment.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {data.investments.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Investments:</span>
              <span className="font-semibold text-gray-900">
                Rs. {data.investments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Donations Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-semibold text-gray-900">Charitable Donations</h3>
          <button
            onClick={addDonation}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Donation
          </button>
        </div>

        {data.donations.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No donations added. Click "Add Donation" to start.
          </div>
        ) : (
          <div className="space-y-3">
            {data.donations.map((donation, index) => (
              <div key={donation.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={donation.organizationName}
                        onChange={(e) => updateDonation(donation.id, 'organizationName', e.target.value)}
                        placeholder="Organization Name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={donation.organizationNTN}
                        onChange={(e) => updateDonation(donation.id, 'organizationNTN', e.target.value)}
                        placeholder="Organization NTN"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeDonation(donation.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={donation.amount}
                      onChange={(e) => updateDonation(donation.id, 'amount', e.target.value)}
                      placeholder="Amount"
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={donation.receiptNumber}
                      onChange={(e) => updateDonation(donation.id, 'receiptNumber', e.target.value)}
                      placeholder="Receipt Number"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.donations.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Donations:</span>
              <span className="font-semibold text-gray-900">
                Rs. {data.donations.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Zakat Paid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Zakat Paid</h3>
        <div className="relative max-w-md">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="number"
            value={data.zakat}
            onChange={(e) => handleZakatChange(e.target.value)}
            placeholder="0.00"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Enter total Zakat paid during the tax year
        </p>
      </div>

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-900 mb-1">Total Deductions</div>
            <div className="text-xs text-blue-700">
              {data.investments.length} investments • {data.donations.length} donations • Zakat
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-900">
            Rs. {getTotalDeductions().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          <strong>Important:</strong> Ensure all deductions are supported by proper documentation. 
          Only investments in approved funds and donations to approved organizations are eligible for deduction.
        </p>
      </div>
    </div>
  );
};

export default DeductionsSection;
