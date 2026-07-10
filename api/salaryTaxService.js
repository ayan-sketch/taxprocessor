const SALARY_LIABILITY_THRESHOLD = 600000;
const MAX_REASONABLE_INCOME = 1000000000;

const shouldShowSalaryLiabilityDeduction = (salaryAmount) => {
  const salary = Number(salaryAmount);
  return Number.isFinite(salary) && salary > SALARY_LIABILITY_THRESHOLD;
};

const getEffectiveTaxableIncome = (taxableIncome, deductionAmount = 0) => {
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

const validateTaxableIncome = (taxableIncome) => {
  const parsedIncome = Number(taxableIncome);

  if (!Number.isFinite(parsedIncome)) {
    return {
      success: false,
      error: 'Taxable income must be a valid number',
      value: 0
    };
  }

  if (parsedIncome < 0) {
    return {
      success: false,
      error: 'Taxable income must be a non-negative number',
      value: 0
    };
  }

  if (parsedIncome > MAX_REASONABLE_INCOME) {
    return {
      success: false,
      error: 'Taxable income exceeds the maximum reasonable limit',
      value: 0
    };
  }

  return {
    success: true,
    value: Math.round(parsedIncome)
  };
};

const calculateSalaryTaxFromSlabs = (taxableIncome, slabs = []) => {
  const validation = validateTaxableIncome(taxableIncome);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error,
      totalTax: 0
    };
  }

  const income = validation.value;

  const normalizedSlabs = (Array.isArray(slabs) ? slabs : [])
    .filter(Boolean)
    .map((slab) => ({
      ...slab,
      income_from: Number(slab.income_from || 0),
      income_to: slab.income_to === null || slab.income_to === undefined || slab.income_to === '' ? null : Number(slab.income_to),
      fixed_tax: Number(slab.fixed_tax || 0),
      rate_percent: Number(slab.rate_percent || 0),
      tax_credit: Number(slab.tax_credit || 0),
      additional_tax: Number(slab.additional_tax || 0)
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

    const variableTax = Math.round((taxablePortion * slab.rate_percent) / 100);
    const fixedTax = Math.round(slab.fixed_tax);
    const taxCredit = Math.round(slab.tax_credit || 0);
    const additionalTax = Math.round(slab.additional_tax || 0);
    const slabTax = variableTax + fixedTax + additionalTax - taxCredit;
    
    totalTax += Math.max(0, slabTax);

    slabBreakdown.push({
      label: slab.income_to === null ? `${lowerBound.toLocaleString('en-PK')} and above` : `${lowerBound.toLocaleString('en-PK')} - ${slab.income_to.toLocaleString('en-PK')}`,
      taxablePortion,
      excessIncome,
      ratePercent: slab.rate_percent,
      fixedTax,
      variableTax,
      taxCredit,
      additionalTax,
      taxAmount: Math.max(0, slabTax)
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
      totalVariableTax: slabBreakdown.reduce((sum, item) => sum + item.variableTax, 0),
      totalTaxCredit: slabBreakdown.reduce((sum, item) => sum + item.taxCredit, 0),
      totalAdditionalTax: slabBreakdown.reduce((sum, item) => sum + item.additionalTax, 0)
    }
  };
};

module.exports = {
  calculateSalaryTaxFromSlabs,
  shouldShowSalaryLiabilityDeduction,
  SALARY_LIABILITY_THRESHOLD,
  MAX_REASONABLE_INCOME,
  validateTaxableIncome,
  getEffectiveTaxableIncome
};
