import React, { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Calculator, Search, TrendingUp } from 'lucide-react';
import { calculateSalaryTax, formatCurrency, calculateTaxPercentage, getEffectiveTaxableIncome, getActiveSalaryTaxYear, deriveSalaryTaxableAmount } from '../../../utils/taxCalculations';

const SALARY_LIABILITY_THRESHOLD = 600000;
const MAX_REASONABLE_INCOME = 1000000000;
const TAX_CALC_DEBOUNCE_MS = 500;

const shouldShowSalaryLiabilityDeduction = (salaryAmount) => {
  const salary = Number(salaryAmount);
  return Number.isFinite(salary) && salary > SALARY_LIABILITY_THRESHOLD;
};

const SimpleSalaryIncomeSection = ({ data, onUpdate }) => {
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [activeView, setActiveView] = useState('salary-income');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [calculatedTax, setCalculatedTax] = useState(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxYear, setTaxYear] = useState(() => getActiveSalaryTaxYear());
  const [fieldErrors, setFieldErrors] = useState({});
  const [settingsRefreshToken, setSettingsRefreshToken] = useState(0);
  const taxCalculationTimerRef = useRef(null);
  const latestTaxRequestRef = useRef(0);

  // Primary fields shown by default
  const primaryHeads = [
    { code: '1009', label: 'Pay, Wages or Other Remuneration (including Arrears of Salary)' }
  ];

  // Additional fields shown when expanded
  const additionalHeads = [
    { code: '1049', label: 'Allowances' },
    { code: '1008', label: 'Pension / Annuity u/s 12(2)(f)' },
    { code: '1059', label: 'Expenditure Reimbursement' },
    { code: '1089', label: 'Value of Perquisites (including Transport Monetization for Government Servants)' },
    { code: '1099', label: 'Profits in Lieu of or in Addition to Pay, Wages or Other Remuneration (including Employment Termination Benefits)' }
  ];

  const deductionHeads = [
    { code: '64020004', label: 'Salary of Employees u/s 149' },
    { code: '64020005', label: 'Directorship Fee u/s 149(3)' }
  ];

  const salaryHeads = [...primaryHeads, ...additionalHeads];

  // Initialize fields if not present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleSettingsRefresh = () => {
        setTaxYear(getActiveSalaryTaxYear());
        setSettingsRefreshToken((current) => current + 1);
      };

      window.addEventListener('salary-tax-settings-updated', handleSettingsRefresh);
      window.addEventListener('storage', handleSettingsRefresh);

      return () => {
        window.removeEventListener('salary-tax-settings-updated', handleSettingsRefresh);
        window.removeEventListener('storage', handleSettingsRefresh);
      };
    }
  }, []);

  useEffect(() => {
    let updated = false;
    const newData = { ...data };

    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('salaryTaxSettingsDemo');
        if (saved) {
          const parsed = JSON.parse(saved);
          const activeYearSlabs = (Array.isArray(parsed) ? parsed : [])
            .filter((slab) => String(slab.tax_year) === String(taxYear))
            .filter((slab) => slab.is_active !== 0)
            .sort((a, b) => Number(a.income_from) - Number(b.income_from));

          if (activeYearSlabs.length) {
            const settingsPayload = {
              salaryTaxSettings: {
                year: taxYear,
                slabs: activeYearSlabs
              }
            };
            window.localStorage.setItem('salaryTaxSettingsLastUsed', JSON.stringify(settingsPayload));
          }
        }
      } catch (error) {
        console.warn('Unable to sync salary tax settings:', error);
      }
    }

    salaryHeads.forEach(head => {
      if (!newData[head.code]) {
        newData[head.code] = { total: '', exempt: '', normal: '' };
        updated = true;
      }
    });

    deductionHeads.forEach(head => {
      if (!newData[head.code]) {
        newData[head.code] = { amount: '' };
        updated = true;
      }
    });

    if (updated) {
      onUpdate(newData);
    }
  }, [data]);

  const getValidationError = (value) => {
    if (value === '' || value === null || value === undefined) return null;

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return 'Please enter a valid whole rupee amount.';
    }

    if (numericValue < 0) {
      return 'Value cannot be negative.';
    }

    if (numericValue > MAX_REASONABLE_INCOME) {
      return `Value cannot exceed ${formatCurrency(MAX_REASONABLE_INCOME)}.`;
    }

    return null;
  };

  const sanitizeNumericValue = (value) => {
    if (value === '' || value === null || value === undefined) return '';

    const trimmed = String(value).trim();
    if (trimmed === '') return '';

    const numericValue = Number(trimmed);
    if (!Number.isFinite(numericValue)) return '';
    if (numericValue < 0) return '';

    return Math.round(numericValue);
  };

  const handleChange = (code, field, value) => {
    const sanitizedValue = sanitizeNumericValue(value);
    const headData = data[code] || { total: '', exempt: '', normal: '' };
    const error = getValidationError(sanitizedValue);
    const nextData = {
      ...data,
      [code]: {
        ...headData,
        [field]: sanitizedValue
      }
    };

    setFieldErrors((current) => ({
      ...current,
      [`${code}-${field}`]: error
    }));

    triggerTaxCalculation(nextData, taxYear, { autoPopulateDeduction: true });
    onUpdate(nextData);
  };

  const getVal = (code, field) => {
    return data[code]?.[field] || '';
  };

  const handleDeductionChange = (code, value) => {
    const sanitizedValue = sanitizeNumericValue(value);
    const headData = data[code] || { amount: '' };
    const error = getValidationError(sanitizedValue);
    const nextData = {
      ...data,
      [code]: {
        ...headData,
        amount: sanitizedValue
      }
    };

    setFieldErrors((current) => ({
      ...current,
      [`${code}-amount`]: error
    }));

    triggerTaxCalculation(nextData, taxYear, { autoPopulateDeduction: false });
    onUpdate(nextData);
  };

  const getDeductionValue = (code) => {
    return data[code]?.amount || '';
  };

  const calculateSum = (field, currentData = data) => {
    return salaryHeads.reduce((sum, head) => {
      return sum + (parseFloat(currentData[head.code]?.[field]) || 0);
    }, 0);
  };

  const calculateTaxableAmount = (currentData = data) => {
    return salaryHeads.reduce((sum, head) => {
      return sum + deriveSalaryTaxableAmount(currentData[head.code] || {});
    }, 0);
  };

  const triggerTaxCalculation = (currentData, currentTaxYear = taxYear, options = {}) => {
    const { autoPopulateDeduction = false } = options;
    const totalNormalAmount = calculateTaxableAmount(currentData);
    const effectiveTaxableIncome = Math.max(0, totalNormalAmount);

    if (taxCalculationTimerRef.current) {
      window.clearTimeout(taxCalculationTimerRef.current);
    }

    if (effectiveTaxableIncome <= 0) {
      setCalculatedTax(null);
      setTaxLoading(false);
      latestTaxRequestRef.current += 1;
      return;
    }

    const requestId = latestTaxRequestRef.current + 1;
    latestTaxRequestRef.current = requestId;
    setTaxLoading(true);

    taxCalculationTimerRef.current = window.setTimeout(() => {
      calculateSalaryTax(effectiveTaxableIncome, currentTaxYear)
        .then((result) => {
          if (latestTaxRequestRef.current !== requestId) {
            return;
          }

          setCalculatedTax(result.success ? result : null);
          setTaxLoading(false);

          if (autoPopulateDeduction && result.success) {
            const nextSalaryAmount = Math.max(totalNormalAmount, 0);
            const shouldAutoPopulate = shouldShowSalaryLiabilityDeduction(Math.max(calculateSum('total', currentData), nextSalaryAmount));
            if (shouldAutoPopulate) {
              const nextDeductionAmount = String(Math.round(result.totalTax));
              const currentDeductionAmount = currentData['64020004']?.amount;
              if (String(currentDeductionAmount) !== nextDeductionAmount) {
                const nextData = {
                  ...currentData,
                  '64020004': {
                    ...(currentData['64020004'] || { amount: '' }),
                    amount: nextDeductionAmount
                  }
                };
                onUpdate(nextData);
              }
            }
          }
        })
        .catch(() => {
          if (latestTaxRequestRef.current === requestId) {
            setCalculatedTax(null);
            setTaxLoading(false);
          }
        });
    }, TAX_CALC_DEBOUNCE_MS);
  };

  useEffect(() => {
    triggerTaxCalculation(data, taxYear, { autoPopulateDeduction: true });

    return () => {
      if (taxCalculationTimerRef.current) {
        window.clearTimeout(taxCalculationTimerRef.current);
      }
      latestTaxRequestRef.current += 1;
    };
  }, [data, taxYear, settingsRefreshToken]);

  if (!data.hasIncome) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-sm">Enable this income type to add salary details.</p>
      </div>
    );
  }

  const totalSalary = calculateSum('total');
  const totalExempt = calculateSum('exempt');
  const totalNormal = calculateTaxableAmount();
  const showSalaryLiabilityDeduction = shouldShowSalaryLiabilityDeduction(Math.max(totalSalary, totalNormal));
  const salaryLiabilityDeductionHead = deductionHeads.find((head) => head.code === '64020004');
  const visibleDeductionHeads = deductionHeads;
  const normalizedSearch = String(searchTerm || '').trim().toLowerCase();
  const matchesSearch = (head, extraValues = []) => {
    if (!normalizedSearch) return true;
    const haystacks = [head?.code, head?.label, ...extraValues].filter((value) => value !== null && value !== undefined && value !== '');
    return haystacks.some((value) => String(value).toLowerCase().includes(normalizedSearch));
  };
  const filteredPrimaryHeads = primaryHeads.filter((head) => matchesSearch(head, [getVal(head.code, 'total'), getVal(head.code, 'exempt'), getVal(head.code, 'normal')]));
  const filteredAdditionalHeads = showAdditionalFields
    ? additionalHeads.filter((head) => matchesSearch(head, [getVal(head.code, 'total'), getVal(head.code, 'exempt'), getVal(head.code, 'normal')]))
    : [];
  const filteredDeductionHeads = visibleDeductionHeads.filter((head) => matchesSearch(head, [getDeductionValue(head.code)]));

  return (
    <div className="space-y-4">
      {Object.values(fieldErrors).some(Boolean) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Please fix the highlighted salary values before relying on the tax calculation.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <div className={`flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm transition-all ${isSearchOpen ? 'flex-1 min-w-[240px]' : 'w-11'}`}>
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
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search code, description, words or amount"
              className="w-full border-0 bg-transparent text-sm text-gray-700 outline-none"
              autoFocus
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setActiveView('salary-income')}
          className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
            activeView === 'salary-income'
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
          }`}
        >
          Salary Income
        </button>
        <button
          type="button"
          onClick={() => setActiveView('deduction')}
          className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
            activeView === 'deduction'
              ? 'border-amber-600 bg-amber-600 text-white'
              : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
          }`}
        >
          Deduction
        </button>
      </div>

      {activeView === 'salary-income' ? (
        <>
          <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
        <table className="w-full text-sm bg-white border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-white border-b border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-center font-semibold w-24 text-xs uppercase tracking-wider">Code</th>
              <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Total Amount</th>
              <th className="px-4 py-3 text-right font-semibold w-48 text-xs uppercase tracking-wider">Amount Exempt from Tax / Subject to Fixed / Final Tax</th>
              <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Amount Subject to Normal Tax</th>
            </tr>
          </thead>
          <tbody>
            {/* Income from Salary - READ ONLY Header Row (Code 1000) */}
            <tr className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-gray-300">
              <td className="px-4 py-4 font-bold text-gray-900">
                Income from Salary
              </td>
              <td className="px-4 py-4 text-center">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white font-bold rounded-md text-xs shadow-sm">
                  1000
                </span>
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {totalSalary.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {totalExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {totalNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
            </tr>

            {/* Primary Salary Head Rows (Always Visible) */}
            {filteredPrimaryHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-blue-50 transition-colors">
                {/* Description */}
                <td className="px-4 py-3 text-gray-800 font-medium">
                  {head.label}
                </td>

                {/* Code */}
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-xs border border-gray-300">
                    {head.code}
                  </span>
                </td>

                {/* Total Amount Input */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={getVal(head.code, 'total')}
                        onChange={(e) => handleChange(head.code, 'total', e.target.value)}
                        placeholder="0"
                        className={`w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-all hover:border-blue-400 hover:shadow-sm ${fieldErrors[`${head.code}-total`] ? 'border-red-400' : 'border-gray-300'}`}
                      />
                    </div>
                    {fieldErrors[`${head.code}-total`] && <p className="text-xs text-red-600">{fieldErrors[`${head.code}-total`]}</p>}
                  </div>
                </td>

                {/* Exempt Amount Input */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={getVal(head.code, 'exempt')}
                        onChange={(e) => handleChange(head.code, 'exempt', e.target.value)}
                        placeholder="0"
                        className={`w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-all hover:border-blue-400 hover:shadow-sm ${fieldErrors[`${head.code}-exempt`] ? 'border-red-400' : 'border-gray-300'}`}
                      />
                    </div>
                    {fieldErrors[`${head.code}-exempt`] && <p className="text-xs text-red-600">{fieldErrors[`${head.code}-exempt`]}</p>}
                  </div>
                </td>

                {/* Normal Tax Amount Input */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={getVal(head.code, 'normal')}
                        onChange={(e) => handleChange(head.code, 'normal', e.target.value)}
                        placeholder="0"
                        className={`w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-all hover:border-blue-400 hover:shadow-sm ${fieldErrors[`${head.code}-normal`] ? 'border-red-400' : 'border-gray-300'}`}
                      />
                    </div>
                    {fieldErrors[`${head.code}-normal`] && <p className="text-xs text-red-600">{fieldErrors[`${head.code}-normal`]}</p>}
                  </div>
                </td>
              </tr>
            ))}

            {salaryLiabilityDeductionHead && (
              <tr className="border-b border-gray-200 bg-amber-50/80 transition-colors">
                <td className="px-4 py-3 text-gray-800 font-medium">
                  <div className="flex items-center gap-2">
                    <span>{salaryLiabilityDeductionHead.label}</span>
                    {showSalaryLiabilityDeduction && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Threshold active
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-xs border border-gray-300">
                    {salaryLiabilityDeductionHead.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={getDeductionValue(salaryLiabilityDeductionHead.code)}
                        onChange={(e) => handleDeductionChange(salaryLiabilityDeductionHead.code, e.target.value)}
                        placeholder="0"
                        className={`w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-950 font-semibold transition-all hover:border-amber-400 hover:shadow-sm ${fieldErrors[`${salaryLiabilityDeductionHead.code}-amount`] ? 'border-red-400' : 'border-amber-300'}`}
                      />
                    </div>
                    {fieldErrors[`${salaryLiabilityDeductionHead.code}-amount`] && <p className="text-xs text-red-600">{fieldErrors[`${salaryLiabilityDeductionHead.code}-amount`]}</p>}
                  </div>
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
              </tr>
            )}

            {/* Expand/Collapse Button Row */}
            <tr className="bg-gray-50 border-b border-gray-300">
              <td colSpan="5" className="px-4 py-3">
                <button
                  onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                >
                  {showAdditionalFields ? (
                    <>
                      <Minus className="w-4 h-4" />
                      <span>Hide Additional Fields</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add More Salary Heads ({additionalHeads.length} available)</span>
                    </>
                  )}
                </button>
              </td>
            </tr>

            {/* Additional Salary Head Rows (Conditionally Visible) */}
            {showAdditionalFields && filteredAdditionalHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-blue-50 transition-colors">
                {/* Description */}
                <td className="px-4 py-3 text-gray-800 font-medium">
                  {head.label}
                </td>

                {/* Code */}
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-xs border border-gray-300">
                    {head.code}
                  </span>
                </td>

                {/* Total Amount Input */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={getVal(head.code, 'total')}
                        onChange={(e) => handleChange(head.code, 'total', e.target.value)}
                        placeholder="0"
                        className={`w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-all hover:border-blue-400 hover:shadow-sm ${fieldErrors[`${head.code}-total`] ? 'border-red-400' : 'border-gray-300'}`}
                      />
                    </div>
                    {fieldErrors[`${head.code}-total`] && <p className="text-xs text-red-600">{fieldErrors[`${head.code}-total`]}</p>}
                  </div>
                </td>

                {/* Exempt Amount Input */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={getVal(head.code, 'exempt')}
                        onChange={(e) => handleChange(head.code, 'exempt', e.target.value)}
                        placeholder="0"
                        className={`w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-all hover:border-blue-400 hover:shadow-sm ${fieldErrors[`${head.code}-exempt`] ? 'border-red-400' : 'border-gray-300'}`}
                      />
                    </div>
                    {fieldErrors[`${head.code}-exempt`] && <p className="text-xs text-red-600">{fieldErrors[`${head.code}-exempt`]}</p>}
                  </div>
                </td>

                {/* Normal Tax Amount Input */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={getVal(head.code, 'normal')}
                        onChange={(e) => handleChange(head.code, 'normal', e.target.value)}
                        placeholder="0"
                        className={`w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-all hover:border-blue-400 hover:shadow-sm ${fieldErrors[`${head.code}-normal`] ? 'border-red-400' : 'border-gray-300'}`}
                      />
                    </div>
                    {fieldErrors[`${head.code}-normal`] && <p className="text-xs text-red-600">{fieldErrors[`${head.code}-normal`]}</p>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>

          {totalNormal > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                Calculated Salary Tax
                <span className="text-sm font-normal text-gray-600">(Tax Year: {taxYear})</span>
              </h3>
              
              {taxLoading ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Calculating tax...</span>
                </div>
              ) : calculatedTax && calculatedTax.success ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Taxable Income</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(totalNormal)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 shadow-sm border-2 border-green-300">
                      <p className="text-xs font-medium text-green-800 mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Total Tax Payable
                      </p>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(calculatedTax.totalTax)}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Effective Rate: {calculateTaxPercentage(calculatedTax.totalTax, totalNormal)}
                      </p>
                    </div>
                  </div>

                  {calculatedTax.breakdown && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Progressive Tax Breakdown:</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Fixed Tax:</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {formatCurrency(calculatedTax.breakdown.totalFixedTax || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Variable Tax:</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {formatCurrency(calculatedTax.breakdown.totalVariableTax || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        {calculatedTax.breakdown.slabs?.map((item, index) => (
                          <div key={`${item.label}-${index}`} className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-gray-800">{item.label}</span>
                              <span className="font-semibold text-gray-900">{formatCurrency(item.taxAmount)}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              {item.taxablePortion.toLocaleString('en-PK')} @ {item.ratePercent}% + fixed {formatCurrency(item.fixedTax)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-100 rounded-lg p-3 border border-blue-300">
                    <p className="text-xs text-blue-900">
                      <strong>Note:</strong> Tax calculation is based on centralized tax slabs. 
                      All rates are automatically applied from the system settings.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  Unable to calculate tax. Please check tax settings.
                </div>
              )}
            </div>
          </div>
        </div>
          )}
        </>
      ) : (
        <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
          <table className="w-full text-sm bg-white border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-amber-800 to-amber-700 text-white border-b border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-center font-semibold w-24 text-xs uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gradient-to-r from-amber-100 to-amber-50 border-b border-gray-300">
                <td className="px-4 py-4 font-bold text-gray-900">Deductions</td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-block px-3 py-1 bg-amber-600 text-white font-bold rounded-md text-xs shadow-sm">
                    6402
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-bold text-gray-900">-</td>
              </tr>

              {filteredDeductionHeads.map((head) => (
                <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-amber-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800 font-medium">{head.label}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-xs border border-gray-300">
                      {head.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={getDeductionValue(head.code)}
                        onChange={(e) => handleDeductionChange(head.code, e.target.value)}
                        placeholder="0"
                        className={`w-full pl-10 pr-3 py-2.5 text-sm text-right border-2 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-950 font-semibold transition-all hover:border-amber-400 hover:shadow-sm ${fieldErrors[`${head.code}-amount`] ? 'border-red-400' : 'border-gray-300'}`}
                      />
                    </div>
                    {fieldErrors[`${head.code}-amount`] && <p className="text-xs text-red-600">{fieldErrors[`${head.code}-amount`]}</p>}
                  </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SimpleSalaryIncomeSection;
