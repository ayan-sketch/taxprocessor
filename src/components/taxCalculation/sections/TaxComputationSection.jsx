import React, { useEffect } from 'react';
import { Calculator, Info } from 'lucide-react';

const TaxComputationSection = ({ data, allData, onUpdate }) => {
  // Calculate total income from all sources
  const calculateTotalIncome = () => {
    let total = 0;

    // Salary Income
    if (allData.salaryIncome.hasIncome) {
      allData.salaryIncome.entries.forEach(entry => {
        const gross = parseFloat(entry.grossSalary) || 0;
        const allowances = parseFloat(entry.allowances) || 0;
        total += gross + allowances;
      });
    }

    // Business Income
    if (allData.businessIncome.hasIncome) {
      allData.businessIncome.entries.forEach(entry => {
        const gross = parseFloat(entry.grossReceipts) || 0;
        const cost = parseFloat(entry.costOfSales) || 0;
        const operating = parseFloat(entry.operatingExpenses) || 0;
        const other = parseFloat(entry.otherExpenses) || 0;
        total += gross - cost - operating - other;
      });
    }

    // Property Income
    if (allData.propertyIncome.hasIncome) {
      allData.propertyIncome.entries.forEach(entry => {
        const rent = parseFloat(entry.annualRent) || 0;
        const repair = parseFloat(entry.repairMaintenance) || 0;
        const insurance = parseFloat(entry.insurance) || 0;
        const other = parseFloat(entry.otherExpenses) || 0;
        total += rent - repair - insurance - other;
      });
    }

    // Capital Gains
    if (allData.capitalGains.hasIncome) {
      allData.capitalGains.entries.forEach(entry => {
        const sale = parseFloat(entry.salePrice) || 0;
        const purchase = parseFloat(entry.purchasePrice) || 0;
        const expenses = parseFloat(entry.expenses) || 0;
        total += sale - purchase - expenses;
      });
    }

    // Other Income
    if (allData.otherIncome.hasIncome) {
      allData.otherIncome.entries.forEach(entry => {
        total += parseFloat(entry.amount) || 0;
      });
    }

    return total;
  };

  // Calculate total deductions
  const calculateTotalDeductions = () => {
    let total = 0;

    // Investments
    allData.deductions.investments.forEach(item => {
      total += parseFloat(item.amount) || 0;
    });

    // Donations
    allData.deductions.donations.forEach(item => {
      total += parseFloat(item.amount) || 0;
    });

    // Zakat
    total += parseFloat(allData.deductions.zakat) || 0;

    return total;
  };

  // Calculate taxable income
  const calculateTaxableIncome = () => {
    const totalIncome = calculateTotalIncome();
    const totalDeductions = calculateTotalDeductions();
    return Math.max(0, totalIncome - totalDeductions);
  };

  // Update tax computation whenever data changes
  useEffect(() => {
    const totalIncome = calculateTotalIncome();
    const totalDeductions = calculateTotalDeductions();
    const taxableIncome = calculateTaxableIncome();

    onUpdate({
      totalIncome,
      totalDeductions,
      taxableIncome,
      taxChargeable: 0, // Will be calculated in Phase 2
      taxPaid: 0,
      refundDue: 0
    });
  }, [allData]);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Calculator className="w-6 h-6 text-blue-600" />
          Tax Computation
        </h2>
        <p className="text-gray-600 mt-1">
          Summary of your income, deductions, and tax calculation
        </p>
      </div>

      {/* Income Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Income Summary</h3>
        
        <div className="space-y-3">
          {allData.salaryIncome.hasIncome && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Salary Income</span>
              <span className="font-medium text-gray-900">
                Rs. {allData.salaryIncome.entries.reduce((sum, entry) => {
                  const gross = parseFloat(entry.grossSalary) || 0;
                  const allowances = parseFloat(entry.allowances) || 0;
                  return sum + gross + allowances;
                }, 0).toLocaleString()}
              </span>
            </div>
          )}

          {allData.businessIncome.hasIncome && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Business Income</span>
              <span className="font-medium text-gray-900">
                Rs. {allData.businessIncome.entries.reduce((sum, entry) => {
                  const gross = parseFloat(entry.grossReceipts) || 0;
                  const cost = parseFloat(entry.costOfSales) || 0;
                  const operating = parseFloat(entry.operatingExpenses) || 0;
                  const other = parseFloat(entry.otherExpenses) || 0;
                  return sum + (gross - cost - operating - other);
                }, 0).toLocaleString()}
              </span>
            </div>
          )}

          {allData.propertyIncome.hasIncome && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Property Income</span>
              <span className="font-medium text-gray-900">
                Rs. {allData.propertyIncome.entries.reduce((sum, entry) => {
                  const rent = parseFloat(entry.annualRent) || 0;
                  const repair = parseFloat(entry.repairMaintenance) || 0;
                  const insurance = parseFloat(entry.insurance) || 0;
                  const other = parseFloat(entry.otherExpenses) || 0;
                  return sum + (rent - repair - insurance - other);
                }, 0).toLocaleString()}
              </span>
            </div>
          )}

          {allData.capitalGains.hasIncome && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Capital Gains</span>
              <span className="font-medium text-gray-900">
                Rs. {allData.capitalGains.entries.reduce((sum, entry) => {
                  const sale = parseFloat(entry.salePrice) || 0;
                  const purchase = parseFloat(entry.purchasePrice) || 0;
                  const expenses = parseFloat(entry.expenses) || 0;
                  return sum + (sale - purchase - expenses);
                }, 0).toLocaleString()}
              </span>
            </div>
          )}

          {allData.otherIncome.hasIncome && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Other Income</span>
              <span className="font-medium text-gray-900">
                Rs. {allData.otherIncome.entries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t-2 border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">Total Income</span>
            <span className="text-xl font-bold text-gray-900">
              Rs. {data.totalIncome.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Deductions Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Deductions Summary</h3>
        
        <div className="space-y-3">
          {allData.deductions.investments.length > 0 && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Investments ({allData.deductions.investments.length})</span>
              <span className="font-medium text-gray-900">
                Rs. {allData.deductions.investments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
          )}

          {allData.deductions.donations.length > 0 && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Donations ({allData.deductions.donations.length})</span>
              <span className="font-medium text-gray-900">
                Rs. {allData.deductions.donations.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
          )}

          {parseFloat(allData.deductions.zakat) > 0 && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Zakat Paid</span>
              <span className="font-medium text-gray-900">
                Rs. {parseFloat(allData.deductions.zakat).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t-2 border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">Total Deductions</span>
            <span className="text-xl font-bold text-gray-900">
              Rs. {data.totalDeductions.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Final Computation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-blue-900 text-lg">Taxable Income</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Total Income</span>
            <span className="font-medium text-gray-900">Rs. {data.totalIncome.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Less: Total Deductions</span>
            <span className="font-medium text-gray-900">Rs. {data.totalDeductions.toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-blue-300">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-900">Taxable Income</span>
            <span className="text-3xl font-bold text-blue-900">
              Rs. {data.taxableIncome.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tax Calculation Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-yellow-900">
          <strong>Note:</strong> Actual tax calculation will be implemented in Phase 2. 
          This section currently shows your taxable income after deductions. 
          Tax rates will be applied according to Pakistan's tax slabs.
        </div>
      </div>
    </div>
  );
};

export default TaxComputationSection;
