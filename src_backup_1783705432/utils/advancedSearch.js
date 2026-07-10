/**
 * Advanced search and filtering utilities for tax returns
 */

/**
 * Filter returns by date range
 * @param {Array} returns - Array of tax return objects
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} dateField - Field to filter by ('processedDate', 'filingDate', 'deadline')
 * @returns {Array} - Filtered returns
 */
export function filterByDateRange(returns, startDate, endDate, dateField = 'processedDate') {
  if (!returns || !Array.isArray(returns)) return [];
  if (!startDate && !endDate) return returns;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  return returns.filter(ret => {
    const date = new Date(ret[dateField]);
    if (isNaN(date.getTime())) return false;

    if (start && date < start) return false;
    if (end && date > end) return false;

    return true;
  });
}

/**
 * Filter returns by tax year range
 * @param {Array} returns - Array of tax return objects
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Array} - Filtered returns
 */
export function filterByTaxYearRange(returns, startYear, endYear) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!startYear && !endYear) return returns;

  return returns.filter(ret => {
    const year = parseInt(ret.taxYear);
    if (isNaN(year)) return false;

    if (startYear && year < startYear) return false;
    if (endYear && year > endYear) return false;

    return true;
  });
}

/**
 * Filter returns by income bracket
 * @param {Array} returns - Array of tax return objects
 * @param {number} minIncome - Minimum income
 * @param {number} maxIncome - Maximum income
 * @returns {Array} - Filtered returns
 */
export function filterByIncomeBracket(returns, minIncome, maxIncome) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!minIncome && !maxIncome) return returns;

  return returns.filter(ret => {
    const income = parseFloat(ret.incomeAmount);
    if (isNaN(income)) return false;

    if (minIncome && income < minIncome) return false;
    if (maxIncome && income > maxIncome) return false;

    return true;
  });
}

/**
 * Filter returns by status
 * @param {Array} returns - Array of tax return objects
 * @param {Array} statuses - Array of status strings to include
 * @returns {Array} - Filtered returns
 */
export function filterByStatus(returns, statuses) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!statuses || statuses.length === 0) return returns;

  return returns.filter(ret => {
    const status = ret.status || 'Pending';
    return statuses.includes(status);
  });
}

/**
 * Filter returns by tax paid range
 * @param {Array} returns - Array of tax return objects
 * @param {number} minTax - Minimum tax paid
 * @param {number} maxTax - Maximum tax paid
 * @returns {Array} - Filtered returns
 */
export function filterByTaxPaid(returns, minTax, maxTax) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!minTax && !maxTax) return returns;

  return returns.filter(ret => {
    const tax = parseFloat(ret.taxPaid);
    if (isNaN(tax)) return false;

    if (minTax && tax < minTax) return false;
    if (maxTax && tax > maxTax) return false;

    return true;
  });
}

/**
 * Filter returns by refund amount range
 * @param {Array} returns - Array of tax return objects
 * @param {number} minRefund - Minimum refund
 * @param {number} maxRefund - Maximum refund
 * @returns {Array} - Filtered returns
 */
export function filterByRefund(returns, minRefund, maxRefund) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!minRefund && !maxRefund) return returns;

  return returns.filter(ret => {
    const refund = parseFloat(ret.refundAmount);
    if (isNaN(refund)) return false;

    if (minRefund && refund < minRefund) return false;
    if (maxRefund && refund > maxRefund) return false;

    return true;
  });
}

/**
 * Get high-value returns (above threshold)
 * @param {Array} returns - Array of tax return objects
 * @param {number} threshold - Income threshold (default: 1000000)
 * @returns {Array} - High-value returns
 */
export function getHighValueReturns(returns, threshold = 1000000) {
  if (!returns || !Array.isArray(returns)) return [];
  return returns.filter(ret => {
    const income = parseFloat(ret.incomeAmount);
    return !isNaN(income) && income >= threshold;
  });
}

/**
 * Get returns with urgent deadlines (within days)
 * @param {Array} returns - Array of tax return objects
 * @param {number} daysThreshold - Number of days (default: 7)
 * @returns {Array} - Returns with urgent deadlines
 */
export function getUrgentDeadlines(returns, daysThreshold = 7) {
  if (!returns || !Array.isArray(returns)) return [];
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  return returns.filter(ret => {
    if (!ret.deadline) return false;
    
    const deadline = new Date(ret.deadline);
    if (isNaN(deadline.getTime())) return false;

    return deadline >= now && deadline <= thresholdDate;
  });
}

/**
 * Get overdue returns (past deadline)
 * @param {Array} returns - Array of tax return objects
 * @returns {Array} - Overdue returns
 */
export function getOverdueReturns(returns) {
  if (!returns || !Array.isArray(returns)) return [];
  const now = new Date();

  return returns.filter(ret => {
    if (!ret.deadline) return false;
    
    const deadline = new Date(ret.deadline);
    if (isNaN(deadline.getTime())) return false;

    const status = ret.status || 'Pending';
    return deadline < now && status !== 'Filed' && status !== 'Completed';
  });
}

/**
 * Normalize text for search matching.
 * @param {unknown} value - Value to normalize
 * @returns {string} - Normalized text
 */
function normalizeSearchText(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Recursively collect searchable values from nested objects and arrays.
 * @param {unknown} value - Value to inspect
 * @param {string[]} collected - Collected strings
 * @returns {string[]} - Searchable values
 */
function collectSearchableValues(value, collected = []) {
  if (value === null || value === undefined) return collected;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const normalized = normalizeSearchText(value);
    if (normalized) collected.push(normalized);
    return collected;
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectSearchableValues(item, collected));
    return collected;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, nestedValue]) => {
      const normalizedKey = normalizeSearchText(key);
      if (normalizedKey) collected.push(normalizedKey);
      collectSearchableValues(nestedValue, collected);
    });
  }

  return collected;
}

/**
 * Check whether a value is numeric.
 * @param {unknown} value - Value to inspect
 * @returns {boolean} - Whether the value is numeric
 */
function isNumericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,/\s]/g, '');
    return !Number.isNaN(Number(cleaned));
  }
  return false;
}

/**
 * Convert a value to a number when possible.
 * @param {unknown} value - Value to inspect
 * @returns {number|null} - Numeric value or null
 */
function getNumericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const numericValue = Number(cleaned);
    return Number.isNaN(numericValue) ? null : numericValue;
  }
  return null;
}

/**
 * Simple fuzzy matching for search terms.
 * @param {string} text - Text to compare
 * @param {string} pattern - Pattern to match
 * @returns {boolean} - Whether the pattern roughly matches the text
 */
function fuzzyMatch(text, pattern) {
  if (!text || !pattern) return false;

  const normalizedText = normalizeSearchText(text);
  const normalizedPattern = normalizeSearchText(pattern);

  if (!normalizedText || !normalizedPattern) return false;
  if (normalizedText.includes(normalizedPattern)) return true;

  let patternIndex = 0;
  for (let i = 0; i < normalizedText.length && patternIndex < normalizedPattern.length; i++) {
    if (normalizedText[i] === normalizedPattern[patternIndex]) {
      patternIndex += 1;
    }
  }

  return patternIndex === normalizedPattern.length;
}

/**
 * Match a field-specific query such as status:pending or amount:250000.
 * @param {Object} returnItem - Tax return object
 * @param {string} field - Field name to inspect
 * @param {string} queryValue - Value to match
 * @returns {boolean} - Whether the field matches
 */
function matchesFieldQuery(returnItem, field, queryValue) {
  const normalizedField = field.toLowerCase();
  const normalizedQuery = normalizeSearchText(queryValue);

  const fieldAliases = {
    name: ['name', 'client', 'client_name', 'clientname', 'fullname'],
    cnic: ['cnic', 'ntn', 'tin', 'taxid', 'cnicntn', 'cnic_ntn'],
    year: ['year', 'taxyear', 'tax_year'],
    status: ['status'],
    note: ['note', 'notes', 'remarks', 'comments', 'summary'],
    amount: ['amount', 'income', 'incomeamount', 'income_amount', 'taxpaid', 'tax_paid', 'refund', 'refundamount', 'refund_amount', 'value', 'total'],
    code: ['code', 'codes', 'sectioncode', 'section_code', 'entrycode', 'entry_code'],
    description: ['description', 'desc', 'detail', 'details', 'word', 'words', 'keyword', 'keywords']
  };

  const aliases = fieldAliases[normalizedField] || [normalizedField];

  const valuesToCheck = [];
  const stack = [returnItem];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current === null || current === undefined) continue;
    if (Array.isArray(current)) {
      current.forEach(item => stack.push(item));
      continue;
    }
    if (typeof current === 'object') {
      Object.entries(current).forEach(([key, value]) => {
        const normalizedKey = normalizeSearchText(key);
        const matchesAlias = aliases.some(alias => normalizedKey.includes(alias));
        if (matchesAlias) valuesToCheck.push(value);
        stack.push(value);
      });
      continue;
    }

    valuesToCheck.push(current);
  }

  return valuesToCheck.some(value => {
    if (isNumericValue(value) && isNumericValue(queryValue)) {
      const valueNumber = getNumericValue(value);
      const queryNumber = getNumericValue(queryValue);
      if (valueNumber !== null && queryNumber !== null) {
        return valueNumber === queryNumber;
      }
    }

    const comparableValue = normalizeSearchText(value);
    return comparableValue.includes(normalizedQuery) || fuzzyMatch(comparableValue, normalizedQuery);
  });
}

function valueMatchesQuery(value, query) {
  const normalizedValue = normalizeSearchText(value);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedValue || !normalizedQuery) return false;
  if (normalizedValue === normalizedQuery) return true;
  if (normalizedValue.includes(normalizedQuery)) return true;

  const valueParts = normalizedValue.split(' ');
  return valueParts.some(part => part.includes(normalizedQuery) || fuzzyMatch(part, normalizedQuery));
}

/**
 * Search returns by text query (name, CNIC/NTN, amount, code, notes, nested wealth data)
 * @param {Array} returns - Array of tax return objects
 * @param {string} query - Search query
 * @param {Object} options - Optional search settings
 * @returns {Array} - Matching returns
 */
export function searchReturns(returns, query, options = {}) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!query || query.trim() === '') return returns;

  const normalizedQuery = normalizeSearchText(query);
  const trimmedQuery = query.trim();
  const fieldQueryMatch = trimmedQuery.match(/^([a-z_]+)\s*(<=|>=|=|:)\s*(.+)$/i);

  return returns.filter(ret => {
    const shouldSkipHidden = options.includeHidden === false && (
      ret.hidden || ret.isHidden || ret.archived || ret.isArchived
    );
    if (shouldSkipHidden) return false;

    if (fieldQueryMatch) {
      const [, rawField, operator, rawValue] = fieldQueryMatch;
      const field = rawField.toLowerCase();
      const queryValue = rawValue.trim();

      if (field === 'amount' || field === 'income' || field === 'refund' || field === 'tax') {
      const numericValues = collectSearchableValues(ret).filter(isNumericValue);
      const numericQueryValue = getNumericValue(queryValue);
      if (numericValues.length > 0 && numericQueryValue !== null) {
        const numericFieldValues = numericValues.map(getNumericValue).filter(value => value !== null);
        const hasNumericMatch = numericFieldValues.some(value => {
          switch (operator) {
            case '<=':
              return value <= numericQueryValue;
            case '>=':
              return value >= numericQueryValue;
            case '=':
            case ':':
              return value === numericQueryValue;
            default:
              return false;
          }
        });
        if (hasNumericMatch) return true;
      }
    }

    return matchesFieldQuery(ret, field, queryValue);
    }

    const searchableValues = collectSearchableValues(ret);
    return searchableValues.some(value => valueMatchesQuery(value, normalizedQuery));
  });
}

/**
 * Apply multiple filters to returns
 * @param {Array} returns - Array of tax return objects
 * @param {Object} filters - Filter configuration object
 * @returns {Array} - Filtered returns
 */
export function applyAdvancedFilters(returns, filters) {
  if (!returns || !Array.isArray(returns)) return [];
  let filtered = [...returns];

  // Text search
  if (filters.searchQuery) {
    filtered = searchReturns(filtered, filters.searchQuery);
  }

  // Date range
  if (filters.startDate || filters.endDate) {
    filtered = filterByDateRange(
      filtered, 
      filters.startDate, 
      filters.endDate, 
      filters.dateField || 'processedDate'
    );
  }

  // Tax year range
  if (filters.startYear || filters.endYear) {
    filtered = filterByTaxYearRange(filtered, filters.startYear, filters.endYear);
  }

  // Income bracket
  if (filters.minIncome || filters.maxIncome) {
    filtered = filterByIncomeBracket(filtered, filters.minIncome, filters.maxIncome);
  }

  // Status
  if (filters.statuses && filters.statuses.length > 0) {
    filtered = filterByStatus(filtered, filters.statuses);
  }

  // Tax paid range
  if (filters.minTax || filters.maxTax) {
    filtered = filterByTaxPaid(filtered, filters.minTax, filters.maxTax);
  }

  // Refund range
  if (filters.minRefund || filters.maxRefund) {
    filtered = filterByRefund(filtered, filters.minRefund, filters.maxRefund);
  }

  // Quick filters
  if (filters.highValueOnly) {
    filtered = getHighValueReturns(filtered, filters.highValueThreshold);
  }

  if (filters.urgentOnly) {
    filtered = getUrgentDeadlines(filtered, filters.urgentDaysThreshold);
  }

  if (filters.overdueOnly) {
    filtered = getOverdueReturns(filtered);
  }

  return filtered;
}

/**
 * Sort returns by field
 * @param {Array} returns - Array of tax return objects
 * @param {string} field - Field to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} - Sorted returns
 */
export function sortReturns(returns, field, order = 'asc') {
  if (!returns || !Array.isArray(returns)) return [];
  const sorted = [...returns].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];

    // Handle numeric fields
    if (['incomeAmount', 'taxPaid', 'refundAmount', 'taxYear'].includes(field)) {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }

    // Handle date fields
    if (['processedDate', 'filingDate', 'deadline'].includes(field)) {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
    }

    // Handle string fields
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Get predefined income brackets
 * @returns {Array} - Array of income bracket objects
 */
export function getIncomeBrackets() {
  return [
    { label: 'Under 400,000', min: 0, max: 400000 },
    { label: '400,000 - 800,000', min: 400000, max: 800000 },
    { label: '800,000 - 1,200,000', min: 800000, max: 1200000 },
    { label: '1,200,000 - 2,400,000', min: 1200000, max: 2400000 },
    { label: '2,400,000 - 4,800,000', min: 2400000, max: 4800000 },
    { label: 'Above 4,800,000', min: 4800000, max: null }
  ];
}

/**
 * Get available status options
 * @returns {Array} - Array of status strings
 */
export function getStatusOptions() {
  return [
    'Pending',
    'In Progress',
    'Filed',
    'Completed',
    'Refund Received',
    'Under Review',
    'Rejected',
    'Amended'
  ];
}
