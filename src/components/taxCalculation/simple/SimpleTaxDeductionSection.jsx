import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

const taxDeductionSections = [
  {
    id: 'deductible-allowances',
    label: 'Deductible Allowances',
    description: 'Use this section to record deductible allowance values and supporting details.'
  },
  {
    id: 'tax-chargeable',
    label: 'Tax Chargeable',
    description: 'Capture the chargeable tax amount and related adjustments for this item.'
  },
  {
    id: 'payment',
    label: 'Payment',
    description: 'Enter payment dates, modes, and amounts for the selected tax deduction workflow.'
  },
  {
    id: 'tax-reductions',
    label: 'Tax Reductions',
    description: 'Record any reductions that should lower the overall tax liability.'
  },
  {
    id: 'tax-credits',
    label: 'Tax Credits',
    description: 'Enter available tax credits and their computed impact.'
  },
  {
    id: 'capital-assets',
    label: 'Capital Assets',
    description: 'Capture capital asset values and their tax treatment.'
  },
  {
    id: 'adjustable-tax',
    label: 'Adjustable Tax',
    description: 'Use this section to enter adjustable tax amounts and calculations.'
  },
  {
    id: 'average-tax',
    label: 'Average Tax',
    description: 'Record the inputs used for an average-tax calculation.'
  },
  {
    id: 'fixed-final-tax',
    label: 'Fixed / Final Tax',
    description: 'Enter the fixed or final tax amounts that apply to this item.'
  },
  {
    id: 'minimum-tax',
    label: 'Minimum Tax',
    description: 'Record minimum tax liabilities and supporting values.'
  },
  {
    id: 'computations',
    label: 'Computations',
    description: 'Show the computation logic, totals, and final values for this section.'
  }
];

const deductibleAllowanceItems = [
  {
    code: '9009',
    label: 'Deductible Allowances'
  },
  {
    code: '9001',
    label: 'Zakat u/s 60'
  },
  {
    code: '9002',
    label: 'Workers Welfare Fund u/s 60A'
  },
  {
    code: '9008',
    label: 'Educational Expenses u/s 60D'
  },
  {
    code: '900801',
    label: 'No. of Children for whom tuition fee is paid'
  }
];

const taxReductionItems = [
  {
    code: '9309',
    label: 'Tax Reduction for Full Time Teacher / Researcher (Except teachers of medical professions who derive income from private medical practice)'
  },
  {
    code: '9302',
    label: 'Tax Reduction on income derived from a startup business, owned 100% by Women'
  },
  {
    code: '930201',
    label: 'Tax Reduction on Tax Charged on Behbood Certificates / Pensioner\'s Benefit Account in excess of applicable rate'
  },
  {
    code: '930101',
    label: 'Tax Reduction on Tax Charged on Behbood Certificates / Pensioner\'s Benefit Account in excess of applicable rate'
  },
  {
    code: '930701',
    label: 'Tax Reduction on Capital Gain on Immovable Property under clause (9A), Part III, Second Schedule for Ex-Servicemen and serving personnel of Armed Forces and ex-employees and serving personnel of Federal & Provincial Government @50%'
  },
  {
    code: '930702',
    label: 'Tax Reduction on Capital Gain on Immovable Property under clause (9A), Part III, Second Schedule for Ex-Servicemen and serving personnel of Armed Forces and ex-employees and serving personnel of Federal & Provincial Government @75%'
  }
];

const taxCreditItems = [
  {
    code: '9329',
    label: 'Tax Credit for Charitable Donations u/s 61'
  },
  {
    code: '9311',
    label: 'Tax Credit for Contribution to Approved Pension Fund u/s 63'
  },
  {
    code: '9313',
    label: 'Tax credit u/s 64D for POS machine'
  },
  {
    code: '9332',
    label: 'Tax Credit for Certain Persons (Coal Mining Projects, Startups) u/s 65F'
  },
  {
    code: '931901',
    label: 'Investment Tax Credit for Specified industrial undertaking u/s 65G'
  },
  {
    code: '931902',
    label: 'Tax credit u/s 65G specified Industrial Undertakings'
  },
  {
    code: '931903',
    label: 'Tax Credit u/s 103'
  },
  {
    code: '9320',
    label: 'Tax Credit for Tax Paid on Share Income from AOP'
  },
  {
    code: '9321',
    label: 'Tax credit for Charitable Organizations u/s 100C'
  },
  {
    code: '9323',
    label: 'Surrender of Tax Credit on Investments in Shares disposed off before time limit'
  },
  {
    code: '9328',
    label: 'Tax Credit for Charitable Donations u/s 61 where the donation is made to associate'
  },
  {
    code: '9331',
    label: 'Tax Credit for Charitable Donations u/s 61 where the donation is made to associate'
  }
];

const SimpleTaxDeductionSection = ({ data, onUpdate, searchTerm = '' }) => {
  const [activeSubTab, setActiveSubTab] = useState(data?.activeTaxSubTab || taxDeductionSections[0].id);
  const [searchValue, setSearchValue] = useState(searchTerm);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (data?.activeTaxSubTab && data.activeTaxSubTab !== activeSubTab) {
      setActiveSubTab(data.activeTaxSubTab);
    }
  }, [data?.activeTaxSubTab]);

  const selectedSection = taxDeductionSections.find((section) => section.id === activeSubTab) || taxDeductionSections[0];

  const handleTabChange = (tabId) => {
    setActiveSubTab(tabId);
    onUpdate({
      ...data,
      activeTaxSubTab: tabId
    });
  };

  const deductibleAllowances = data?.deductibleAllowances?.length
    ? data.deductibleAllowances
    : deductibleAllowanceItems.map((item) => ({
        ...item,
        total: '',
        inadmissible: '',
        admissible: ''
      }));

  const updateDeductibleAllowance = (code, field, value) => {
    const nextValues = (data?.deductibleAllowances?.length
      ? data.deductibleAllowances
      : deductibleAllowanceItems.map((item) => ({
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

  const taxReductions = data?.taxReductions?.length
    ? data.taxReductions
    : taxReductionItems.map((item) => ({
        ...item,
        totalAmount: '',
        taxChargeable: '',
        taxReduced: ''
      }));

  const updateTaxReduction = (code, field, value) => {
    const nextValues = (data?.taxReductions?.length
      ? data.taxReductions
      : taxReductionItems.map((item) => ({
          ...item,
          totalAmount: '',
          taxChargeable: '',
          taxReduced: ''
        }))).map((item) => (
      item.code === code ? { ...item, [field]: value } : item
    ));

    onUpdate({
      ...data,
      taxReductions: nextValues
    });
  };

  const taxCredits = data?.taxCredits?.length
    ? data.taxCredits
    : taxCreditItems.map((item) => ({
        ...item,
        eligibleAmount: '',
        ineligibleAmount: '',
        taxCredit: ''
      }));

  const normalizedSearch = String(searchValue || '').trim().toLowerCase();
  const matchesSearch = (item, extraValues = []) => {
    if (!normalizedSearch) return true;
    const haystacks = [item?.code, item?.label, ...extraValues].filter((value) => value !== null && value !== undefined && value !== '');
    return haystacks.some((value) => String(value).toLowerCase().includes(normalizedSearch));
  };
  const filteredDeductibleAllowances = deductibleAllowances.filter((item) => matchesSearch(item, [item.total, item.inadmissible, item.admissible]));
  const filteredTaxReductions = taxReductions.filter((item) => matchesSearch(item, [item.totalAmount, item.taxChargeable, item.taxReduced]));
  const filteredTaxCredits = taxCredits.filter((item) => matchesSearch(item, [item.eligibleAmount, item.ineligibleAmount, item.taxCredit]));

  const updateTaxCredit = (code, field, value) => {
    const nextValues = (data?.taxCredits?.length
      ? data.taxCredits
      : taxCreditItems.map((item) => ({
          ...item,
          eligibleAmount: '',
          ineligibleAmount: '',
          taxCredit: ''
        }))).map((item) => (
      item.code === code ? { ...item, [field]: value } : item
    ));

    onUpdate({
      ...data,
      taxCredits: nextValues
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {taxDeductionSections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => handleTabChange(section.id)}
            className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
              activeSubTab === section.id
                ? 'border-violet-600 bg-violet-600 text-white'
                : 'border-violet-200 bg-white text-violet-700 hover:bg-violet-50'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 p-4">
        <div className={`flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 shadow-sm transition-all ${isSearchOpen ? 'flex-1 min-w-[240px]' : 'w-11'}`}>
          <button
            type="button"
            onClick={() => setIsSearchOpen((open) => !open)}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-violet-50"
            aria-label="Toggle search"
          >
            <Search className="h-4 w-4 text-violet-400" />
          </button>
          {isSearchOpen && (
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search code, description, words or amount"
              className="w-full border-0 bg-transparent text-sm text-gray-700 outline-none"
              autoFocus
            />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
        <div className="text-sm font-semibold text-violet-900">{selectedSection.label}</div>
        <p className="mt-1 text-sm text-violet-800">{selectedSection.description}</p>
      </div>

      {selectedSection.id === 'deductible-allowances' ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <div className="mb-3 font-medium text-gray-900">Deductible Allowances</div>
          <div className="overflow-x-auto">
            <div className="min-w-[860px] rounded-lg border border-gray-200">
              <div className="grid grid-cols-[minmax(0,1.8fr)_100px_140px_140px_140px] bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                <div className="border-b border-gray-200 px-3 py-2">Description</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Code</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Total</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Inadmissible</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Admissible</div>
              </div>

              {filteredDeductibleAllowances.map((item) => (
                <div key={item.code} className="grid grid-cols-[minmax(0,1.8fr)_100px_140px_140px_140px] border-b border-gray-200 last:border-b-0 bg-white">
                  <div className="px-3 py-2 text-sm text-gray-800">{item.label}</div>
                  <div className="border-l border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">{item.code}</div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.total}
                      onChange={(e) => updateDeductibleAllowance(item.code, 'total', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.inadmissible}
                      onChange={(e) => updateDeductibleAllowance(item.code, 'inadmissible', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.admissible}
                      onChange={(e) => updateDeductibleAllowance(item.code, 'admissible', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {selectedSection.id === 'tax-reductions' ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <div className="mb-3 font-medium text-gray-900">Tax Reductions</div>
          <div className="overflow-x-auto">
            <div className="min-w-[860px] rounded-lg border border-gray-200">
              <div className="grid grid-cols-[minmax(0,1.8fr)_100px_140px_140px_140px] bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                <div className="border-b border-gray-200 px-3 py-2">Description</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Code</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Total Amount</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Tax Chargeable</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Tax Reducted</div>
              </div>

              {filteredTaxReductions.map((item) => (
                <div key={item.code} className="grid grid-cols-[minmax(0,1.8fr)_100px_140px_140px_140px] border-b border-gray-200 last:border-b-0 bg-white">
                  <div className="px-3 py-2 text-sm text-gray-800">{item.label}</div>
                  <div className="border-l border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">{item.code}</div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.totalAmount}
                      onChange={(e) => updateTaxReduction(item.code, 'totalAmount', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.taxChargeable}
                      onChange={(e) => updateTaxReduction(item.code, 'taxChargeable', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.taxReduced}
                      onChange={(e) => updateTaxReduction(item.code, 'taxReduced', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {selectedSection.id === 'tax-credits' ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <div className="mb-3 font-medium text-gray-900">Tax Credits</div>
          <div className="overflow-x-auto">
            <div className="min-w-[860px] rounded-lg border border-gray-200">
              <div className="grid grid-cols-[minmax(0,1.8fr)_100px_140px_140px_140px] bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                <div className="border-b border-gray-200 px-3 py-2">Description</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Code</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Eligible Amount</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Ineligible Amount</div>
                <div className="border-b border-gray-200 border-l border-gray-200 px-3 py-2">Tax Credit</div>
              </div>

              {filteredTaxCredits.map((item) => (
                <div key={item.code} className="grid grid-cols-[minmax(0,1.8fr)_100px_140px_140px_140px] border-b border-gray-200 last:border-b-0 bg-white">
                  <div className="px-3 py-2 text-sm text-gray-800">{item.label}</div>
                  <div className="border-l border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">{item.code}</div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.eligibleAmount}
                      onChange={(e) => updateTaxCredit(item.code, 'eligibleAmount', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.ineligibleAmount}
                      onChange={(e) => updateTaxCredit(item.code, 'ineligibleAmount', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="border-l border-gray-200 px-2 py-2">
                    <input
                      type="number"
                      value={item.taxCredit}
                      onChange={(e) => updateTaxCredit(item.code, 'taxCredit', e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SimpleTaxDeductionSection;
