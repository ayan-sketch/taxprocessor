import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Search, Trash2 } from 'lucide-react';
import { deriveSalaryTaxableAmount } from '../../../utils/taxCalculations';

const DEFAULT_VALUES = {
  7051: '',
  7052: '',
  7055: '',
  7056: '',
  7058: '',
  7059: '',
  7060: '',
  7061: '',
  7066: '',
  7070: '',
  7071: '',
  7072: '',
  7073: '',
  7076: '',
  7087: '',
  7088: '',
  7004: '',
  7005: '',
  7010: '',
  7011: '',
  7012: '',
  '7013a': '',
  '7013b': '',
  7018: '',
  7022: '',
  703002: '',
  7031: '',
  7032: '',
  7033: '',
  7035: '',
  7038: '',
  7039: '',
  7048: '',
  7043: '',
  7098: '',
  7092: '',
  703004: ''
};

const EXPENSE_ROWS = [
  { code: '7051', label: 'Rent' },
  { code: '7052', label: 'Rates / Taxes / Charge / Cess' },
  { code: '7055', label: 'Vehicle Running / Maintenance' },
  { code: '7056', label: 'Travelling' },
  { code: '7058', label: 'Electricity' },
  { code: '7059', label: 'Water' },
  { code: '7060', label: 'Gas' },
  { code: '7061', label: 'Telephone' },
  { code: '7066', label: 'Asset Insurance / Security' },
  { code: '7070', label: 'Medical' },
  { code: '7071', label: 'Educational' },
  { code: '7072', label: 'Club' },
  { code: '7073', label: 'Functions / Gatherings' },
  { code: '7076', label: 'Donation, Zakat, Annuity, Life Insurance Premium, etc.' },
  { code: '7087', label: 'Other Personal / Household Expenses' },
  { code: '7088', label: 'Contribution in Expenses by Family Members' }
];

const ASSET_SIMPLE_ROWS = [
  { code: '7004', label: 'Equipment (Non-Business)' },
  { code: '7005', label: 'Animal (Non-Business)' },
  { code: '7010', label: 'Household Effect' },
  { code: '7011', label: 'Personal Item' },
  { code: '7012', label: 'Cash (Non-Business)' },
  { code: '7013a', label: 'Any Other Asset – Easypaisa Account' },
  { code: '7013b', label: 'Any Other Asset – Allied Bank' },
  { code: '7018', label: 'Capital or voting rights in foreign company' },
  { code: '7022', label: 'Foreign Liabilities' }
];

const MULTI_ENTRY_CODES = ['7001', '7002', '7003', '7006', '7007', '7008', '7009', '7013', '7014', '7016', '7021', '7034', '7036', '7037', '7091'];

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

const getHeadAmount = (headData = {}) => {
  if (headData?.normal !== '' && headData?.normal !== null && headData?.normal !== undefined) {
    const normalizedNormal = Number(headData.normal);
    if (Number.isFinite(normalizedNormal) && normalizedNormal >= 0) {
      return normalizedNormal;
    }
  }

  const totalValue = Number(headData?.total || 0);
  const exemptValue = Number(headData?.exempt || 0);

  if (!Number.isFinite(totalValue) || !Number.isFinite(exemptValue)) {
    return 0;
  }

  return Math.max(0, Math.round(totalValue - exemptValue));
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createInitialSectionData = (data = {}) => {
  const values = {
    ...DEFAULT_VALUES,
    ...(data?.values || {})
  };

  const entries = {};
  Object.entries(data?.entries || {}).forEach(([code, list]) => {
    if (Array.isArray(list)) {
      entries[code] = list;
    }
  });

  return {
    hasIncome: Boolean(data?.hasIncome),
    values,
    entries
  };
};

const getEntryTotal = (code, entries = {}) => {
  return (entries[code] || []).reduce((sum, entry) => sum + toNumber(entry.amount), 0);
};

const buildCalculations = (values = {}, entries = {}) => {
  const expenseCodes = ['7051', '7052', '7055', '7056', '7058', '7059', '7060', '7061', '7066', '7070', '7071', '7072', '7073', '7076', '7087'];
  const expenseTotal = Math.round(expenseCodes.reduce((sum, code) => sum + toNumber(values[code]), 0) - toNumber(values['7088']));

  const insideCodes = ['7001', '7002', '7003', '7004', '7005', '7006', '7007', '7008', '7009', '7010', '7011', '7012', '7013', '7013a', '7013b', '7014'];
  const insideAssets = insideCodes.reduce((sum, code) => {
    if (MULTI_ENTRY_CODES.includes(code)) {
      return sum + getEntryTotal(code, entries);
    }
    return sum + toNumber(values[code]);
  }, 0);

  const outsideAssets = getEntryTotal('7016', entries) + toNumber(values['7018']);
  const totalAssets = insideAssets + outsideAssets;
  const totalLiabilities = getEntryTotal('7021', entries) + toNumber(values['7022']);
  const netAssets = totalAssets - totalLiabilities;

  const increase = netAssets - toNumber(values['703002']);
  const inflowCodes = ['7031', '7032', '7033', '7034', '7035', '7036', '7037', '7038', '7039', '7048', '7043'];
  const inflows = inflowCodes.reduce((sum, code) => {
    if (MULTI_ENTRY_CODES.includes(code)) {
      return sum + getEntryTotal(code, entries);
    }
    return sum + toNumber(values[code]);
  }, 0) + increase;

  const outflows = expenseTotal + getEntryTotal('7091', entries) + toNumber(values['7098']) + toNumber(values['7092']);
  const unreconciled = inflows - outflows;

  return {
    expenses: { total7089: expenseTotal },
    assets: {
      insideAssets,
      outsideAssets,
      totalAssets,
      totalLiabilities,
      netAssets
    },
    recon: {
      increase,
      totalInflows: inflows,
      totalOutflows: outflows,
      unreconciled
    }
  };
};

const getEntryModalFields = (code) => {
  if (code === '7037' || code === '7091') {
    return [
      { key: 'id_type', label: 'ID Type', type: 'select', options: ['CNIC/NICOP', 'NTN', 'POC'] },
      { key: 'id_number', label: 'ID Number', type: 'text' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' }
    ];
  }

  if (code === '7034' || code === '7036') {
    return [
      { key: 'contents', label: 'Description / Contents', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' }
    ];
  }

  if (code === '7001' || code === '7002') {
    return [
      { key: 'property', label: 'Property / Location', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' }
    ];
  }

  if (code === '7003') {
    return [
      { key: 'name', label: 'Name / Business', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' }
    ];
  }

  return [
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'amount', label: 'Amount', type: 'number' }
  ];
};

const createEmptyEntry = (code) => {
  if (code === '7037' || code === '7091') {
    return { id: Date.now(), code, entry_type: code === '7037' ? 'gift_inflow' : 'gift_outflow', id_type: 'CNIC/NICOP', id_number: '', name: '', description: '', amount: '' };
  }

  if (code === '7034' || code === '7036') {
    return { id: Date.now(), code, entry_type: 'content', contents: '', amount: '' };
  }

  if (code === '7001' || code === '7002') {
    return { id: Date.now(), code, entry_type: 'asset', property: '', description: '', amount: '' };
  }

  if (code === '7003') {
    return { id: Date.now(), code, entry_type: 'asset', name: '', amount: '' };
  }

  return { id: Date.now(), code, entry_type: 'asset', description: '', amount: '' };
};

const validateEntry = (code, entry) => {
  if (code === '7037' || code === '7091') {
    const idType = entry.id_type;
    const idNumber = String(entry.id_number || '').trim();
    if (!entry.name || !entry.description || toNumber(entry.amount) <= 0) {
      return 'Name, description and amount are required.';
    }
    if (idType === 'CNIC/NICOP' && !/^\d{13}$/.test(idNumber)) {
      return 'CNIC/NICOP must be exactly 13 digits.';
    }
    if (idType === 'NTN' && !/^\d{7}$/.test(idNumber)) {
      return 'NTN must be exactly 7 digits.';
    }
    if (idType === 'POC' && !idNumber) {
      return 'POC number is required.';
    }
    return null;
  }

  if (code === '7034' || code === '7036') {
    if (!entry.contents || toNumber(entry.amount) <= 0) {
      return 'Description and amount are required.';
    }
    return null;
  }

  if (code === '7001' || code === '7002') {
    if (!entry.property || !entry.description || toNumber(entry.amount) <= 0) {
      return 'Property, description and amount are required.';
    }
    return null;
  }

  if (code === '7003') {
    if (!entry.name || toNumber(entry.amount) <= 0) {
      return 'Business name and amount are required.';
    }
    return null;
  }

  if (!entry.description || toNumber(entry.amount) <= 0) {
    return 'Description and amount are required.';
  }
  return null;
};

const getDisplayAmountValue = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue === 0) return '';
  return value;
};

const InputWithPrefix = ({ value, onChange, placeholder = '' }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-semibold">Rs.</span>
    <input
      type="number"
      min="0"
      step="1"
      value={getDisplayAmountValue(value)}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-right text-sm font-semibold text-gray-900 outline-none focus:border-blue-500"
    />
  </div>
);

const SimpleWealthStatementSection = ({ data, onUpdate, formData = {}, searchTerm = '' }) => {
  const [activeTab, setActiveTab] = useState('expenses');
  const [searchValue, setSearchValue] = useState(searchTerm);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showExtraExpenseRows, setShowExtraExpenseRows] = useState(false);
  const [entryModal, setEntryModal] = useState({ open: false, code: null, entry: null });
  const [entryDraft, setEntryDraft] = useState({});
  const [entryError, setEntryError] = useState('');

  const sectionData = useMemo(() => createInitialSectionData(data), [data]);
  const values = sectionData.values || {};
  const entries = sectionData.entries || {};
  const calculations = useMemo(() => buildCalculations(values, entries), [values, entries]);
  const normalizedSearch = String(searchValue || '').trim().toLowerCase();
  const matchesSearch = (row, amount = 0) => {
    if (!normalizedSearch) return true;
    const haystacks = [row?.code, row?.label, amount].filter((value) => value !== null && value !== undefined && value !== '');
    return haystacks.some((value) => String(value).toLowerCase().includes(normalizedSearch));
  };
  const baseExpenseRows = EXPENSE_ROWS.filter((row) => {
    if (row.code === '7087' || row.code === '7088') {
      return row.code === '7087';
    }

    const numericValue = Number(values[row.code] ?? 0);
    const hasEnteredValue = Number.isFinite(numericValue) && numericValue > 0;
    return showExtraExpenseRows || normalizedSearch || hasEnteredValue;
  });
  const filteredExpenseRows = baseExpenseRows.filter((row) => matchesSearch(row, values[row.code] ?? 0));
  const filteredAssetRows = [
    { code: '7001', label: 'Agricultural Property', type: 'multi' },
    { code: '7002', label: 'Commercial / Residential Property (Non-Business)', type: 'multi' },
    { code: '7003', label: 'Business Capital', type: 'multi' },
    ...ASSET_SIMPLE_ROWS,
    { code: '7013', label: 'Any Other Asset', type: 'multi' },
    { code: '7014', label: 'Assets held on others name', type: 'multi' }
  ].filter((row) => {
    const amount = row.type === 'multi' ? getEntryTotal(row.code, entries) : values[row.code] ?? 0;
    return matchesSearch(row, amount);
  });
  const filteredOutsideAssetRows = [
    { code: '7016', label: 'Assets held outside Pakistan', type: 'multi' },
    { code: '7018', label: 'Capital or voting rights in foreign company', type: 'simple' }
  ].filter((row) => {
    const amount = row.type === 'multi' ? getEntryTotal(row.code, entries) : values[row.code] ?? 0;
    return matchesSearch(row, amount);
  });
  const filteredReconRows = [
    { code: '703001', label: 'Net Assets Current Year', amount: calculations.assets.netAssets },
    { code: '703002', label: 'Net Assets Previous Year', amount: values['703002'] ?? 0, input: true },
    { code: '703003', label: 'Increase / Decrease in Assets', amount: calculations.recon.increase },
    { code: '7031', label: 'Income – Normal Tax', amount: values['7031'] ?? 0, input: true },
    { code: '7032', label: 'Income – Exempt from Tax', amount: values['7032'] ?? 0, input: true },
    { code: '7033', label: 'Income – Final / Fixed Tax', amount: values['7033'] ?? 0, input: true },
    { code: '7034', label: 'Adjustments in Inflows', amount: getEntryTotal('7034', entries), action: true },
    { code: '7035', label: 'Foreign Remittance', amount: values['7035'] ?? 0, input: true },
    { code: '7036', label: 'Inheritance', amount: getEntryTotal('7036', entries), action: true },
    { code: '7037', label: 'Gift (Inflow)', amount: getEntryTotal('7037', entries), action: true },
    { code: '7038', label: 'Gain on Disposal of Assets', amount: values['7038'] ?? 0, input: true },
    { code: '7039', label: 'Income – Builders/Developers', amount: values['7039'] ?? 0, input: true },
    { code: '7048', label: 'Others (Inflow)', amount: values['7048'] ?? 0, input: true },
    { code: '7043', label: 'Deemed Income', amount: values['7043'] ?? 0, input: true },
    { code: '7049', label: 'Total Inflows', amount: calculations.recon.totalInflows },
    { code: '7089', label: 'Personal Expenses', amount: calculations.expenses.total7089 },
    { code: '7098', label: 'Adjustments in Outflows', amount: values['7098'] ?? 0, input: true },
    { code: '7091', label: 'Gift (Outflow)', amount: getEntryTotal('7091', entries), action: true },
    { code: '7092', label: 'Loss on Disposal of Assets', amount: values['7092'] ?? 0, input: true },
    { code: '7099', label: 'Total Outflows', amount: calculations.recon.totalOutflows },
    { code: '703000', label: 'Unreconciled Amount', amount: calculations.recon.unreconciled },
    { code: '703004', label: 'Assets Transferred / Sold / Gifted / Donated', amount: values['703004'] ?? 0, input: true }
  ].filter((row) => matchesSearch(row, row.amount));

  const autoIncomeSource = useMemo(() => {
    const salaryIncome = formData?.salaryIncome || {};
    const salaryHeads = ['1009', '1049', '1008', '1059', '1089', '1099'];
    const salaryAmount = salaryHeads.reduce((sum, headCode) => {
      return sum + deriveSalaryTaxableAmount(salaryIncome[headCode] || {});
    }, 0);
    const salaryDeduction = Number(salaryIncome['64020004']?.amount || 0);
    const netSalary = Math.max(0, salaryAmount - salaryDeduction);

    const propertyIncome = formData?.propertyIncome || {};
    const propertyReceipts = ['2001', '2002', '2003', '2004', '2005'].reduce((sum, headCode) => {
      return sum + getHeadAmount(propertyIncome[headCode] || {});
    }, 0);
    const propertyDeductions = ['2031', '2033', '2037', '2032', '2034', '2035', '2036', '2038', '2039', '2097', '2098', '64080001'].reduce((sum, headCode) => {
      const headData = propertyIncome[headCode] || {};
      if (headData?.amount !== '' && headData?.amount !== null && headData?.amount !== undefined) {
        return sum + Number(headData.amount || 0);
      }
      return sum + getHeadAmount(headData);
    }, 0);
    const netProperty = Math.max(0, propertyReceipts - propertyDeductions);

    // Foreign Income (Code 6000)
    const foreignIncome = formData?.foreignSource || {};
    const foreignHeads = ['6011', '6029', '6039', '6049', '6059'];
    const totalForeignIncome = foreignHeads.reduce((sum, headCode) => {
      return sum + toNumber(foreignIncome[headCode]?.total);
    }, 0);

    // Agriculture Income (Code 6100)
    const agricultureIncome = toNumber(foreignIncome['6100']?.total);

    return {
      netSalary,
      netProperty,
      totalNormal: netSalary + netProperty,
      totalExempt: totalForeignIncome + agricultureIncome
    };
  }, [formData]);

  useEffect(() => {
    let updated = false;
    const nextValues = { ...values };

    // Auto-fill 7031 (Normal Tax)
    if (autoIncomeSource.totalNormal > 0) {
      const current7031Value = Number(values['7031'] || 0);
      if (current7031Value !== autoIncomeSource.totalNormal) {
        nextValues['7031'] = autoIncomeSource.totalNormal;
        updated = true;
      }
    }

    // Auto-fill 7032 (Exempt from Tax)
    if (autoIncomeSource.totalExempt > 0) {
      const current7032Value = Number(values['7032'] || 0);
      if (current7032Value !== autoIncomeSource.totalExempt) {
        nextValues['7032'] = autoIncomeSource.totalExempt;
        updated = true;
      }
    }

    if (updated) {
      onUpdate({
        ...sectionData,
        hasIncome: true,
        values: nextValues,
        entries
      });
    }
  }, [autoIncomeSource.totalNormal, autoIncomeSource.totalExempt, values, sectionData, entries, onUpdate]);

  const shouldDisplaySection = Boolean(sectionData.hasIncome || autoIncomeSource.totalNormal > 0 || autoIncomeSource.totalExempt > 0 || Object.values(values).some((value) => Number(value) > 0) || Object.keys(entries).length > 0);

  if (!shouldDisplaySection) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
        <p className="text-sm">Enter salary or property income to auto-fill the wealth statement reconciliation values.</p>
      </div>
    );
  }

  const handleValueChange = (code, rawValue) => {
    const nextValues = {
      ...values,
      [code]: rawValue === '' ? '' : Number(rawValue)
    };
    onUpdate({ ...sectionData, values: nextValues, entries });
  };

  const handleOpenEntryModal = (code, entry = null) => {
    setEntryDraft(entry ? { ...entry } : createEmptyEntry(code));
    setEntryModal({ open: true, code, entry });
    setEntryError('');
  };

  const handleCloseEntryModal = () => {
    setEntryModal({ open: false, code: null, entry: null });
    setEntryDraft({});
    setEntryError('');
  };

  const handleEntryDraftChange = (field, value) => {
    setEntryDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSaveEntry = () => {
    const code = entryModal.code;
    const validationError = validateEntry(code, entryDraft);
    if (validationError) {
      setEntryError(validationError);
      return;
    }

    const existingEntries = [...(entries[code] || [])];
    const nextEntries = entryModal.entry
      ? existingEntries.map((item) => (item.id === entryModal.entry.id ? { ...item, ...entryDraft } : item))
      : [...existingEntries, { ...entryDraft, amount: Number(entryDraft.amount || 0) }];

    const nextValues = {
      ...values,
      [code]: Math.round(nextEntries.reduce((sum, item) => sum + toNumber(item.amount), 0))
    };

    onUpdate({
      ...sectionData,
      values: nextValues,
      entries: {
        ...entries,
        [code]: nextEntries
      }
    });
    handleCloseEntryModal();
  };

  const handleDeleteEntry = (code, entryId) => {
    const nextEntries = (entries[code] || []).filter((item) => item.id !== entryId);
    const nextValues = {
      ...values,
      [code]: Math.round(nextEntries.reduce((sum, item) => sum + toNumber(item.amount), 0))
    };

    onUpdate({
      ...sectionData,
      values: nextValues,
      entries: {
        ...entries,
        [code]: nextEntries
      }
    });
  };

  const tabs = [
    { key: 'expenses', label: 'Personal Expenses' },
    { key: 'assets', label: 'Assets & Liabilities' },
    { key: 'recon', label: 'Reconciliation' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
        <div className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all ${isSearchOpen ? 'flex-1 min-w-[260px]' : 'w-11'}`}>
          <button
            type="button"
            onClick={() => setIsSearchOpen((open) => !open)}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Toggle search"
          >
            <Search className="h-4 w-4 text-gray-400" />
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
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${activeTab === tab.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'expenses' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Expenses</h3>
              <p className="text-sm text-gray-500">Enter personal and household expenses and the system auto-calculates 7089.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-700">
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenseRows.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100">
                    <td className="px-3 py-3 text-gray-700">{row.label}</td>
                    <td className="px-3 py-3 font-medium text-gray-700">{row.code}</td>
                    <td className="px-3 py-3">
                      {row.code === '7089' ? (
                        <p className="text-right font-semibold text-gray-900">{formatCurrency(calculations.expenses.total7089)}</p>
                      ) : (
                        <InputWithPrefix value={values[row.code] ?? 0} onChange={(event) => handleValueChange(row.code, event.target.value)} />
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50">
                  <td className="px-3 py-3 font-semibold text-blue-900">Personal Expenses</td>
                  <td className="px-3 py-3 font-semibold text-blue-900">7089</td>
                  <td className="px-3 py-3 text-right font-semibold text-blue-900">{formatCurrency(calculations.expenses.total7089)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-3 py-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowExtraExpenseRows((current) => !current)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100"
                        aria-label={showExtraExpenseRows ? 'Hide other codes' : 'Show other codes'}
                      >
                        <Plus className={`h-4 w-4 ${showExtraExpenseRows ? 'rotate-45' : ''} transition-transform`} />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Assets Inside Pakistan</h3>
                <p className="text-sm text-gray-500">Multi-entry fields can be added via the + button.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-700">
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssetRows.map((row) => (
                    <tr key={row.code} className="border-b border-gray-100">
                      <td className="px-3 py-3 text-gray-700">{row.label}</td>
                      <td className="px-3 py-3 font-medium text-gray-700">{row.code}</td>
                      <td className="px-3 py-3">
                        {row.type === 'multi' ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-gray-900">{formatCurrency(getEntryTotal(row.code, entries))}</span>
                            <button type="button" onClick={() => handleOpenEntryModal(row.code)} className="rounded-lg border border-blue-300 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <InputWithPrefix value={values[row.code] ?? 0} onChange={(event) => handleValueChange(row.code, event.target.value)} />
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50">
                    <td className="px-3 py-3 font-semibold text-emerald-900">Total Assets Inside Pakistan</td>
                    <td className="px-3 py-3 font-semibold text-emerald-900">7015</td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-900">{formatCurrency(calculations.assets.insideAssets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Assets Outside Pakistan</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-700">
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutsideAssetRows.map((row) => (
                    <tr key={row.code} className="border-b border-gray-100">
                      <td className="px-3 py-3 text-gray-700">{row.label}</td>
                      <td className="px-3 py-3 font-medium text-gray-700">{row.code}</td>
                      <td className="px-3 py-3">
                        {row.code === '7016' ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-gray-900">{formatCurrency(getEntryTotal('7016', entries))}</span>
                            <button type="button" onClick={() => handleOpenEntryModal('7016')} className="rounded-lg border border-blue-300 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <InputWithPrefix value={values['7018'] ?? 0} onChange={(event) => handleValueChange('7018', event.target.value)} />
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50">
                    <td className="px-3 py-3 font-semibold text-emerald-900">7020</td>
                    <td className="px-3 py-3 font-semibold text-emerald-900">Total Assets held outside Pakistan</td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-900">{formatCurrency(calculations.assets.outsideAssets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Grand Total & Liabilities</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-700">
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-emerald-50">
                    <td className="px-3 py-3 font-semibold text-emerald-900">7019</td>
                    <td className="px-3 py-3 font-semibold text-emerald-900">Total Assets</td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-900">{formatCurrency(calculations.assets.totalAssets)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-3 py-3 font-medium text-gray-700">7021</td>
                    <td className="px-3 py-3 text-gray-700">Credit (Non-Business)</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold text-gray-900">{formatCurrency(getEntryTotal('7021', entries))}</span>
                        <button type="button" onClick={() => handleOpenEntryModal('7021')} className="rounded-lg border border-blue-300 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-3 py-3 font-medium text-gray-700">7022</td>
                    <td className="px-3 py-3 text-gray-700">Foreign Liabilities</td>
                    <td className="px-3 py-3">
                      <InputWithPrefix value={values['7022'] ?? 0} onChange={(event) => handleValueChange('7022', event.target.value)} />
                    </td>
                  </tr>
                  <tr className="bg-amber-50">
                    <td className="px-3 py-3 font-semibold text-amber-900">7029</td>
                    <td className="px-3 py-3 font-semibold text-amber-900">Total Liabilities</td>
                    <td className="px-3 py-3 text-right font-semibold text-amber-900">{formatCurrency(calculations.assets.totalLiabilities)}</td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="px-3 py-3 font-semibold text-blue-900">703001</td>
                    <td className="px-3 py-3 font-semibold text-blue-900">Net Assets Current Year</td>
                    <td className="px-3 py-3 text-right font-semibold text-blue-900">{formatCurrency(calculations.assets.netAssets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recon' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reconciliation of Net Assets</h3>
                <p className="text-sm text-gray-500">The unreconciled amount must be zero for a balanced statement.</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-sm font-semibold ${calculations.recon.unreconciled === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {calculations.recon.unreconciled === 0 ? 'Balanced' : 'Unbalanced'}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-700">
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReconRows.map((row) => (
                    <tr key={row.code} className={row.code === '703003' || row.code === '7049' || row.code === '7099' ? 'bg-blue-50' : row.code === '703000' ? (calculations.recon.unreconciled === 0 ? 'bg-green-50' : 'bg-red-50') : 'border-b border-gray-100'}>
                      <td className={`px-3 py-3 ${row.code === '703003' || row.code === '7049' || row.code === '7099' ? 'font-semibold text-blue-900' : row.code === '703000' ? `font-semibold ${calculations.recon.unreconciled === 0 ? 'text-green-900' : 'text-red-900'}` : 'font-medium text-gray-700'}`}>{row.code}</td>
                      <td className={`px-3 py-3 ${row.code === '703003' || row.code === '7049' || row.code === '7099' ? 'font-semibold text-blue-900' : row.code === '703000' ? `font-semibold ${calculations.recon.unreconciled === 0 ? 'text-green-900' : 'text-red-900'}` : 'text-gray-700'}`}>{row.label}</td>
                      <td className={`px-3 py-3 ${row.code === '703003' || row.code === '7049' || row.code === '7099' || row.code === '703000' ? 'text-right font-semibold' : 'text-right'}`}> 
                        {row.code === '703002' ? (
                          <InputWithPrefix value={values['703002'] ?? 0} onChange={(event) => handleValueChange('703002', event.target.value)} />
                        ) : row.code === '7031' ? (
                          <InputWithPrefix value={values['7031'] ?? 0} onChange={(event) => handleValueChange('7031', event.target.value)} />
                        ) : row.code === '7032' ? (
                          <InputWithPrefix value={values['7032'] ?? 0} onChange={(event) => handleValueChange('7032', event.target.value)} />
                        ) : row.code === '7033' ? (
                          <InputWithPrefix value={values['7033'] ?? 0} onChange={(event) => handleValueChange('7033', event.target.value)} />
                        ) : row.code === '7035' ? (
                          <InputWithPrefix value={values['7035'] ?? 0} onChange={(event) => handleValueChange('7035', event.target.value)} />
                        ) : row.code === '7038' ? (
                          <InputWithPrefix value={values['7038'] ?? 0} onChange={(event) => handleValueChange('7038', event.target.value)} />
                        ) : row.code === '7039' ? (
                          <InputWithPrefix value={values['7039'] ?? 0} onChange={(event) => handleValueChange('7039', event.target.value)} />
                        ) : row.code === '7048' ? (
                          <InputWithPrefix value={values['7048'] ?? 0} onChange={(event) => handleValueChange('7048', event.target.value)} />
                        ) : row.code === '7043' ? (
                          <InputWithPrefix value={values['7043'] ?? 0} onChange={(event) => handleValueChange('7043', event.target.value)} />
                        ) : row.code === '7098' ? (
                          <InputWithPrefix value={values['7098'] ?? 0} onChange={(event) => handleValueChange('7098', event.target.value)} />
                        ) : row.code === '7092' ? (
                          <InputWithPrefix value={values['7092'] ?? 0} onChange={(event) => handleValueChange('7092', event.target.value)} />
                        ) : row.code === '703004' ? (
                          <InputWithPrefix value={values['703004'] ?? 0} onChange={(event) => handleValueChange('703004', event.target.value)} />
                        ) : row.code === '7034' ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-gray-900">{formatCurrency(getEntryTotal('7034', entries))}</span>
                            <button type="button" onClick={() => handleOpenEntryModal('7034')} className="rounded-lg border border-blue-300 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : row.code === '7036' ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-gray-900">{formatCurrency(getEntryTotal('7036', entries))}</span>
                            <button type="button" onClick={() => handleOpenEntryModal('7036')} className="rounded-lg border border-blue-300 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : row.code === '7037' ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-gray-900">{formatCurrency(getEntryTotal('7037', entries))}</span>
                            <button type="button" onClick={() => handleOpenEntryModal('7037')} className="rounded-lg border border-blue-300 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : row.code === '7091' ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-gray-900">{formatCurrency(getEntryTotal('7091', entries))}</span>
                            <button type="button" onClick={() => handleOpenEntryModal('7091')} className="rounded-lg border border-blue-300 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : row.code === '703000' ? (
                          <span className={`font-semibold ${calculations.recon.unreconciled === 0 ? 'text-green-900' : 'text-red-900'}`}>{formatCurrency(calculations.recon.unreconciled)}</span>
                        ) : (
                          <span className="font-semibold text-gray-900">{formatCurrency(row.amount)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {entryModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Entry</h3>
              <button type="button" onClick={handleCloseEntryModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">✕</button>
            </div>

            <div className="mt-4 space-y-3">
              {getEntryModalFields(entryModal.code).map((field) => (
                <label key={field.key} className="block space-y-1 text-sm text-gray-700">
                  <span>{field.label}</span>
                  {field.type === 'select' ? (
                    <select value={entryDraft[field.key] || ''} onChange={(event) => handleEntryDraftChange(field.key, event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500">
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      min="0"
                      step="1"
                      value={entryDraft[field.key] || ''}
                      onChange={(event) => handleEntryDraftChange(field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  )}
                </label>
              ))}
              {entryError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{entryError}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={handleCloseEntryModal} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">Cancel</button>
              <button type="button" onClick={handleSaveEntry} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {Object.keys(entries).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Added Entries Summary</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(entries).filter(([, list]) => Array.isArray(list) && list.length).map(([code, list]) => (
              <div key={code} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">{code}</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(getEntryTotal(code, entries))}</p>
                </div>
                <div className="mt-2 space-y-2">
                  {list.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{entry.description || entry.contents || entry.property || entry.name || 'Entry'}</p>
                        <p className="text-xs text-gray-500">{entry.id_type ? `${entry.id_type}: ${entry.id_number}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{formatCurrency(entry.amount)}</span>
                        <button type="button" onClick={() => handleOpenEntryModal(code, entry)} className="rounded-lg border border-gray-300 px-2 py-1 text-xs">Edit</button>
                        <button type="button" onClick={() => handleDeleteEntry(code, entry.id)} className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleWealthStatementSection;
