import React, { useEffect, useState } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

const businessTabs = [
  { id: 'manufacturing', label: 'Manufacturing / Trading Item' },
  { id: 'revenues', label: 'Other Revenues' },
  { id: 'expenses', label: 'Management, Administrative, Selling & Financial Expenses' },
  { id: 'deductions', label: 'Inadmissible / Admissible Deductions' },
  { id: 'assets', label: 'Business Assets / Equity / Liabilities' }
];

const visibleTabs = [
  { id: 'manufacturing', label: 'Manufacturing / Trading Item' },
  { id: 'revenues', label: 'Other Revenues' },
  { id: 'expenses', label: 'Management, Administrative, Selling & Financial Expenses' }
];

const collapsedTabs = [
  { id: 'deductions', label: 'Inadmissible / Admissible Deductions' },
  { id: 'assets', label: 'Business Assets / Equity / Liabilities' }
];

const otherRevenueItems = [
  { code: '3129', label: 'Other Revenues' },
  { code: '3101', label: 'Fee for Technical / Professional Services' },
  { code: '3115', label: 'Accounting Gain on Sale of Intangibles' },
  { code: '3116', label: 'Accounting Gain on Sale of Assets' },
  { code: '3128', label: 'Others' },
  { code: '3131', label: 'Share in untaxed Income from AOP' },
  { code: '3123', label: 'Gain by builder/developer in excess of 10 times of tax liability under Rule 6 of Eleventh Schedule' },
  { code: '3141', label: 'Share in Taxed Income from AOP' }
];

const manufacturingItems = [
  { code: '3000', label: 'Income / (Loss) from Business' },
  { code: '3029', label: 'Net Revenue (excluding Sales Tax, Federal Excise, Brokerage, Commission, Discount, Freight Outward)' },
  { code: '3009', label: 'Gross Revenue (excluding Sales Tax, Federal Excise)' },
  { code: '3019', label: 'Selling Expenses (Freight Outward, Brokerage, Commission, Discount, etc.)' },
  { code: '3030', label: 'Cost of Sales / Services' },
  { code: '3039', label: 'Opening Stock' },
  { code: '3059', label: 'Net Purchases (excluding Sales Tax, Federal Excise)' },
  { code: '3071', label: 'Salaries / Wages' },
  { code: '3072', label: 'Fuel' },
  { code: '3073', label: 'Power' },
  { code: '3074', label: 'Gas' },
  { code: '3076', label: 'Stores / Spares' },
  { code: '3077', label: 'Repair / Maintenance' },
  { code: '3083', label: 'Other Direct Expenses' },
  { code: '3087', label: 'Accounting Amortization' },
  { code: '3088', label: 'Accounting Depreciation' },
  { code: '3099', label: 'Closing Stock' },
  { code: '3100', label: 'Gross Profit / (Loss)' }
];

const expenseItems = [
  { code: '3199', label: 'Management, Administrative, Selling & Financial Expenses' },
  { code: '3151', label: 'Rent' },
  { code: '3152', label: 'Rates / Taxes / Cess' },
  { code: '3154', label: 'Salaries / Wages / Perquisites / Benefits' },
  { code: '3155', label: 'Traveling / Conveyance / Vehicles Running / Maintenance' },
  { code: '3158', label: 'Electricity / Water / Gas' },
  { code: '3162', label: 'Communication' },
  { code: '3165', label: 'Repair / Maintenance' },
  { code: '3166', label: 'Stationery / Printing / Photocopies / Office Supplies' },
  { code: '3168', label: 'Advertisement / Publicity / Promotion' },
  { code: '3170', label: 'Insurance' },
  { code: '3171', label: 'Professional Charges' },
  { code: '3172', label: 'Profit on Debt (Financial Charges / Markup / Interest)' },
  { code: '3174', label: 'Donation / Charity' },
  { code: '3178', label: 'Brokerage / Commission' },
  { code: '3180', label: 'Other Indirect Expenses' },
  { code: '3186', label: 'Irrecoverable Debts Written off' },
  { code: '3187', label: 'Obsolete Stocks / Stores / Spares / Fixed Assets Written off' },
  { code: '3195', label: 'Accounting (Loss) on Sale of Intangibles' },
  { code: '319501', label: 'Contribution to an Approved gratuity fund / Pension Fund / Superannuation Fund' },
  { code: '3196', label: 'Accounting (Loss) on Sale of Assets' },
  { code: '3197', label: 'Accounting Amortization' },
  { code: '3198', label: 'Accounting Depreciation' },
  { code: '3200', label: 'Accounting Profit / (Loss)' }
];

const deductibleAllowanceItems = [
  { code: '9009', label: 'Deductible Allowances' },
  { code: '9001', label: 'Zakat u/s 60' },
  { code: '9002', label: 'Workers Welfare Fund u/s 60A' },
  { code: '9008', label: 'Educational Expenses u/s 60D' },
  { code: '900801', label: 'No. of Children for whom tuition fee is paid' }
];

const SimpleBusinessIncomeSection = ({ data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState(data?.activeBusinessTab || businessTabs[0].id);
  const [expandedGroup, setExpandedGroup] = useState(null);

  useEffect(() => {
    if (data?.activeBusinessTab && data.activeBusinessTab !== activeTab) {
      setActiveTab(data.activeBusinessTab);
    }
  }, [data?.activeBusinessTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onUpdate({
      ...data,
      activeBusinessTab: tabId
    });
  };

  const toggleSectionGroup = (groupId) => {
    setExpandedGroup((current) => (current === groupId ? null : groupId));
  };

  const selectedTab = businessTabs.find(tab => tab.id === activeTab) || businessTabs[0];

  const deductibleAllowances = data?.deductibleAllowances?.length
    ? data.deductibleAllowances
    : deductibleAllowanceItems.map((item) => ({
        ...item,
        total: '',
        inadmissible: '',
        admissible: ''
      }));

  const updateDeductibleAllowance = (code, field, value) => {
    const nextValues = (data?.deductibleAllowances?.length ? data.deductibleAllowances : deductibleAllowanceItems.map((item) => ({
      ...item,
      total: '',
      inadmissible: '',
      admissible: ''
    }))).map((item) => (
      item.code === code ? { ...item, [field]: value } : item
    ));

    onUpdate({
      ...data,
      deductibleAllowances: nextValues
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="relative">
          <button
            type="button"
            onClick={() => setExpandedGroup((current) => (current === 'more' ? null : 'more'))}
            className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
          >
            {expandedGroup === 'more' ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>

          {expandedGroup === 'more' ? (
            <div className="absolute left-0 top-11 z-10 flex min-w-[220px] flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
              {collapsedTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-sm text-blue-900">
        <div className="font-semibold mb-1">{selectedTab.label}</div>
      </div>

      {selectedTab.id === 'manufacturing' ? (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Manufacturing / Trading Item
          </div>
          <div className="grid gap-2">
            {manufacturingItems.map((item) => (
              <div key={item.code} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Code</div>
                  <div className="text-sm font-semibold text-gray-700">{item.code}</div>
                  <div className="text-sm text-gray-800">{item.label}</div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {selectedTab.id === 'revenues' ? (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Other Revenue Items
          </div>
          <div className="grid gap-2">
            {otherRevenueItems.map((item) => (
              <div key={item.code} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Code</div>
                  <div className="text-sm font-semibold text-gray-700">{item.code}</div>
                  <div className="text-sm text-gray-800">{item.label}</div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {selectedTab.id === 'expenses' ? (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Expense Items
          </div>
          <div className="grid gap-2">
            {expenseItems.map((item) => (
              <div key={item.code} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Code</div>
                  <div className="text-sm font-semibold text-gray-700">{item.code}</div>
                  <div className="text-sm text-gray-800">{item.label}</div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {selectedTab.id === 'deductions' ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Deductible Allowances
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px] rounded-lg border border-gray-200">
              <div className="grid grid-cols-[minmax(0,1.6fr)_100px_120px_120px_120px] bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                <div className="border-b border-gray-200 px-3 py-2">Description</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Code</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Total</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Inadmissible</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Admissible</div>
              </div>

              {deductibleAllowances.map((item) => (
                <div key={item.code} className="grid grid-cols-[minmax(0,1.6fr)_100px_120px_120px_120px] border-b border-gray-200 last:border-b-0 bg-white">
                  <div className="px-3 py-2 text-sm text-gray-800">{item.label}</div>
                  <div className="border-l border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">{item.code}</div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.total}
                      onChange={(e) => updateDeductibleAllowance(item.code, 'total', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.inadmissible}
                      onChange={(e) => updateDeductibleAllowance(item.code, 'inadmissible', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.admissible}
                      onChange={(e) => updateDeductibleAllowance(item.code, 'admissible', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!data?.hasIncome ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          The business sub-sections above are now available. Enable this income type if you want to add detailed business entries.
        </div>
      ) : null}
    </div>
  );
};

export default SimpleBusinessIncomeSection;
