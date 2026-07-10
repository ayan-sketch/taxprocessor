const SLAB_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_REASONABLE_INCOME = 1000000000;

export const persistSalaryTaxSettings = (slabs, selectedYear, storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return null;

  const normalizedSlabs = (Array.isArray(slabs) ? slabs : [])
    .map((slab) => ({
      ...slab,
      tax_year: String(slab.tax_year ?? selectedYear ?? '2026'),
      income_from: Number(slab.income_from || 0),
      income_to: slab.income_to === null || slab.income_to === undefined || slab.income_to === '' ? null : Number(slab.income_to),
      fixed_tax: Number(slab.fixed_tax || 0),
      rate_percent: Number(slab.rate_percent || 0),
      is_active: slab.is_active !== 0 ? 1 : 0
    }));

  storage.setItem('salaryTaxSettingsDemo', JSON.stringify(normalizedSlabs));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('salary-tax-settings-updated'));
  }

  const cacheKey = `salaryTaxSettings:${String(selectedYear || '2026')}`;
  storage.setItem(cacheKey, JSON.stringify({
    cachedAt: Date.now(),
    value: {
      year: String(selectedYear || '2026'),
      slabs: normalizedSlabs
    }
  }));

  return {
    year: String(selectedYear || '2026'),
    slabs: normalizedSlabs
  };
};

export const clearSalaryTaxSettingsCache = (selectedYear, storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return;

  const year = String(selectedYear || '2026');
  storage.removeItem(`salaryTaxSettings:${year}`);
  storage.removeItem('salaryTaxSettings:latest');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('salary-tax-settings-updated'));
  }
};

export const getActiveSalaryTaxYear = (storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return '2026';

  const selectedYear = storage.getItem('salaryTaxSettingsSelectedYear');
  if (selectedYear) {
    return String(selectedYear);
  }

  try {
    const lastUsed = storage.getItem('salaryTaxSettingsLastUsed');
    if (lastUsed) {
      const parsed = JSON.parse(lastUsed);
      if (parsed?.salaryTaxSettings?.year) {
        return String(parsed.salaryTaxSettings.year);
      }
    }
  } catch (error) {
    console.warn('Unable to read the last used salary tax year:', error);
  }

  try {
    const saved = storage.getItem('salaryTaxSettingsDemo');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        const years = [...new Set(parsed.map((slab) => String(slab.tax_year || '2026')).filter(Boolean))];
        if (years.length) {
          return years[0];
        }
      }
    }
  } catch (error) {
    console.warn('Unable to read salary tax years from storage:', error);
  }

  return '2026';
};

export const getEffectiveTaxableIncome = (taxableIncome, deductionAmount = 0) => {
  const parsedIncome = Number(taxableIncome);
  const parsedDeduction = Number(deductionAmount);

  if (!Number.isFinite(parsedIncome) || parsedIncome <= 0) {
    return 0;
  }

  if (!Number.isFinite(parsedDeduction) || parsedDeduction <= 0) {
    return Math.round(parsedIncome);
  }

  return Math.max(0, Math.round(parsedIncome - parsedDeduction));
};

export const deriveSalaryTaxableAmount = (headData = {}) => {
  const normalValue = headData?.normal;
  if (normalValue !== '' && normalValue !== null && normalValue !== undefined) {
    const normalizedNormal = Number(normalValue);
    if (Number.isFinite(normalizedNormal) && normalizedNormal >= 0) {
      return Math.round(normalizedNormal);
    }
  }

  const totalValue = Number(headData?.total || 0);
  const exemptValue = Number(headData?.exempt || 0);

  if (!Number.isFinite(totalValue) || !Number.isFinite(exemptValue)) {
    return 0;
  }

  return Math.max(0, Math.round(totalValue - exemptValue));
};

const getStoredSalaryTaxSettings = (taxYear = '2026') => {
  if (typeof window === 'undefined') return null;

  try {
    const selectedYear = taxYear || window.localStorage.getItem('salaryTaxSettingsSelectedYear') || '2026';
    const cacheKey = `salaryTaxSettings:${selectedYear}`;
    const cached = window.localStorage.getItem(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.cachedAt && Date.now() - parsed.cachedAt < SLAB_CACHE_TTL_MS) {
        return parsed.value;
      }
    }

    const saved = window.localStorage.getItem('salaryTaxSettingsDemo');

    if (!saved) return null;

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.length) return null;

    const slabs = parsed
      .filter((slab) => String(slab.tax_year) === String(selectedYear))
      .map((slab) => ({
        ...slab,
        income_from: Number(slab.income_from || 0),
        income_to: slab.income_to === null || slab.income_to === undefined || slab.income_to === '' ? null : Number(slab.income_to),
        fixed_tax: Number(slab.fixed_tax || 0),
        rate_percent: Number(slab.rate_percent || 0),
        is_active: slab.is_active !== 0 ? 1 : 0
      }))
      .filter((slab) => slab.is_active === 1)
      .sort((a, b) => a.income_from - b.income_from);

    const value = slabs.length ? { year: selectedYear, slabs } : null;
    window.localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), value }));
    return value;
  } catch (error) {
    console.warn('Unable to read salary tax settings from local storage:', error);
    return null;
  }
};

const calculateTaxFromSlabs = (taxableIncome, slabs = []) => {
  const parsedIncome = Number(taxableIncome);

  if (!Number.isFinite(parsedIncome) || parsedIncome < 0) {
    return {
      success: false,
      error: 'Taxable income must be a non-negative number',
      totalTax: 0
    };
  }

  if (parsedIncome > MAX_REASONABLE_INCOME) {
    return {
      success: false,
      error: 'Taxable income exceeds the maximum reasonable limit',
      totalTax: 0
    };
  }

  const income = Math.round(parsedIncome);

  const normalizedSlabs = (Array.isArray(slabs) ? slabs : [])
    .filter(Boolean)
    .map((slab) => ({
      ...slab,
      income_from: Number(slab.income_from || 0),
      income_to: slab.income_to === null || slab.income_to === undefined || slab.income_to === '' ? null : Number(slab.income_to),
      fixed_tax: Number(slab.fixed_tax || 0),
      rate_percent: Number(slab.rate_percent || 0)
    }))
    .filter((slab) => Number.isFinite(slab.income_from) && Number.isFinite(slab.fixed_tax) && Number.isFinite(slab.rate_percent))
    .sort((a, b) => a.income_from - b.income_from);

  if (!normalizedSlabs.length) {
    return {
      success: false,
      error: 'No active salary tax slabs available',
      totalTax: 0
    };
  }

  let totalTax = 0;
  const slabBreakdown = [];
  let previousThreshold = 0;

  normalizedSlabs.forEach((slab) => {
    const lowerBound = slab.income_from;
    const upperBound = slab.income_to === null ? income : Math.min(income, slab.income_to);
    const taxablePortion = Math.max(0, upperBound - previousThreshold);
    const excessIncome = Math.max(0, income - lowerBound);

    if (taxablePortion <= 0) {
      previousThreshold = upperBound;
      return;
    }

    const slabTax = Math.round((taxablePortion * slab.rate_percent) / 100) + Math.round(slab.fixed_tax);
    totalTax += slabTax;

    slabBreakdown.push({
      label: slab.income_to === null ? `${lowerBound.toLocaleString('en-PK')} and above` : `${lowerBound.toLocaleString('en-PK')} - ${slab.income_to.toLocaleString('en-PK')}`,
      taxablePortion,
      excessIncome,
      ratePercent: slab.rate_percent,
      fixedTax: Math.round(slab.fixed_tax),
      taxAmount: slabTax
    });

    previousThreshold = upperBound;
  });

  return {
    success: true,
    totalTax: Math.round(totalTax),
    slab: normalizedSlabs[normalizedSlabs.length - 1],
    breakdown: {
      taxableIncome: income,
      excessIncome: slabBreakdown[slabBreakdown.length - 1]?.excessIncome ?? 0,
      slabs: slabBreakdown,
      totalFixedTax: slabBreakdown.reduce((sum, item) => sum + item.fixedTax, 0),
      totalVariableTax: slabBreakdown.reduce((sum, item) => sum + (item.taxAmount - item.fixedTax), 0)
    }
  };
};

/**
 * Calculate salary tax based on taxable income and tax year
 * Uses the global tax settings from the Tax Settings screen first,
 * then falls back to the centralized salary-tax API when needed.
 *
 * @param {number} taxableIncome - The taxable income amount
 * @param {string} taxYear - The tax year (e.g., "2026")
 * @returns {Promise<Object>} Tax calculation result with breakdown
 */
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.__TAX_API_BASE_URL__) {
    return window.__TAX_API_BASE_URL__;
  }

  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

export const calculateSalaryTax = async (taxableIncome, taxYear = '2026') => {
  try {
    const localSettings = getStoredSalaryTaxSettings(taxYear);
    if (localSettings?.slabs?.length) {
      const localResult = calculateTaxFromSlabs(taxableIncome, localSettings.slabs);
      if (localResult.success) {
        return {
          success: true,
          totalTax: localResult.totalTax,
          breakdown: localResult.breakdown,
          slab: localResult.slab,
          source: 'local-settings'
        };
      }
    }

    const response = await fetch(`${getApiBaseUrl()}/api/salary-tax/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': typeof window !== 'undefined' && (window.localStorage.getItem('userRole') || window.localStorage.getItem('role')) ? 'admin' : 'viewer'
      },
      body: JSON.stringify({
        taxable_income: parseFloat(taxableIncome),
        tax_year: taxYear.toString()
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to calculate tax');
    }

    return {
      success: true,
      totalTax: data.tax ?? data.calculation?.total_tax ?? 0,
      breakdown: data.breakdown || data.calculation || null,
      slab: data.slab || data.calculation?.applicable_slab || null,
      source: 'api'
    };
  } catch (error) {
    console.error('Error calculating salary tax:', error);
    return {
      success: false,
      error: error.message,
      totalTax: 0
    };
  }
};

/**
 * Format currency amount for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${parseFloat(amount).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * Calculate tax percentage of income
 * @param {number} tax - Tax amount
 * @param {number} income - Income amount
 * @returns {string} Percentage string
 */
export const calculateTaxPercentage = (tax, income) => {
  if (!income || income === 0) return '0%';
  return `${((tax / income) * 100).toFixed(2)}%`;
};

/**
 * Get all available tax years from the system
 * @returns {Promise<Array>} Array of tax years
 */
export const getAvailableTaxYears = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/salary-tax/years`);
    const data = await response.json();

    if (data.success) {
      return data.years;
    }

    return ['2026'];
  } catch (error) {
    console.error('Error fetching tax years:', error);
    return ['2026'];
  }
};

/**
 * Get tax slabs for a specific year
 * @param {string} taxYear - The tax year
 * @returns {Promise<Array>} Array of tax slabs
 */
export const getTaxSlabsForYear = async (taxYear) => {
  const localSettings = getStoredSalaryTaxSettings(taxYear);
  if (localSettings?.slabs?.length) {
    return localSettings.slabs;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/salary-tax/slabs/${taxYear}`);
    const data = await response.json();

    if (data.success) {
      return data.slabs;
    }

    return [];
  } catch (error) {
    console.error('Error fetching tax slabs:', error);
    return [];
  }
};
