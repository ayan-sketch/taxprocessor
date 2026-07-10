/**
 * Validation utilities for tax return data
 * Includes CNIC and NTN validation with check digit algorithms
 */

/**
 * Validate Pakistani CNIC format and check digit
 * Format: 12345-6789012-3
 * @param {string} cnic - CNIC to validate
 * @returns {object} - {valid: boolean, error: string}
 */
export function validateCNIC(cnic) {
  if (!cnic) {
    return { valid: false, error: 'CNIC is required' };
  }

  // Remove spaces and dashes for validation
  const cleanCNIC = cnic.replace(/[-\s]/g, '');

  // Check length
  if (cleanCNIC.length !== 13) {
    return { valid: false, error: 'CNIC must be 13 digits' };
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(cleanCNIC)) {
    return { valid: false, error: 'CNIC must contain only digits' };
  }

  // Validate check digit (last digit)
  const checkDigit = parseInt(cleanCNIC[12]);
  const calculatedCheckDigit = calculateCNICCheckDigit(cleanCNIC.substring(0, 12));

  if (checkDigit !== calculatedCheckDigit) {
    return { valid: false, error: 'Invalid CNIC check digit' };
  }

  // Format validation: 12345-6789012-3
  const formatted = `${cleanCNIC.substring(0, 5)}-${cleanCNIC.substring(5, 12)}-${cleanCNIC.substring(12)}`;
  
  return { valid: true, formatted };
}

/**
 * Calculate CNIC check digit using Luhn algorithm
 * @param {string} cnicWithoutCheck - First 12 digits of CNIC
 * @returns {number} - Check digit (0-9)
 */
function calculateCNICCheckDigit(cnicWithoutCheck) {
  let sum = 0;
  let alternate = false;

  // Process digits from right to left
  for (let i = cnicWithoutCheck.length - 1; i >= 0; i--) {
    let digit = parseInt(cnicWithoutCheck[i]);

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Validate Pakistani NTN format and check digit
 * Format: 1234567-8 or 12345678
 * @param {string} ntn - NTN to validate
 * @returns {object} - {valid: boolean, error: string}
 */
export function validateNTN(ntn) {
  if (!ntn) {
    return { valid: false, error: 'NTN is required' };
  }

  // Remove spaces and dashes
  const cleanNTN = ntn.replace(/[-\s]/g, '');

  // Check length (7 or 8 digits)
  if (cleanNTN.length < 7 || cleanNTN.length > 8) {
    return { valid: false, error: 'NTN must be 7 or 8 digits' };
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(cleanNTN)) {
    return { valid: false, error: 'NTN must contain only digits' };
  }

  // If 8 digits, validate check digit
  if (cleanNTN.length === 8) {
    const checkDigit = parseInt(cleanNTN[7]);
    const calculatedCheckDigit = calculateNTNCheckDigit(cleanNTN.substring(0, 7));

    if (checkDigit !== calculatedCheckDigit) {
      return { valid: false, error: 'Invalid NTN check digit' };
    }

    // Format: 1234567-8
    const formatted = `${cleanNTN.substring(0, 7)}-${cleanNTN.substring(7)}`;
    return { valid: true, formatted };
  }

  // 7 digits without check digit
  return { valid: true, formatted: cleanNTN };
}

/**
 * Calculate NTN check digit using modulo 11 algorithm
 * @param {string} ntnWithoutCheck - First 7 digits of NTN
 * @returns {number} - Check digit (0-9)
 */
function calculateNTNCheckDigit(ntnWithoutCheck) {
  const weights = [8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 7; i++) {
    sum += parseInt(ntnWithoutCheck[i]) * weights[i];
  }

  const remainder = sum % 11;
  return remainder === 0 ? 0 : 11 - remainder;
}

/**
 * Validate phone number (Pakistani format)
 * Supports: +92-XXX-XXXXXXX, 03XX-XXXXXXX, international formats
 * @param {string} phone - Phone number to validate
 * @returns {object} - {valid: boolean, error: string}
 */
export function validatePhone(phone) {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Pakistani mobile: starts with +92 or 0, followed by 3XX and 7 digits
  const pkMobilePattern = /^(\+92|0)?3\d{9}$/;
  
  // Pakistani landline: starts with +92 or 0, followed by area code and number
  const pkLandlinePattern = /^(\+92|0)?\d{9,11}$/;
  
  // International format
  const internationalPattern = /^\+\d{10,15}$/;

  if (pkMobilePattern.test(cleanPhone) || pkLandlinePattern.test(cleanPhone) || internationalPattern.test(cleanPhone)) {
    return { valid: true, formatted: phone };
  }

  return { valid: false, error: 'Invalid phone number format' };
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {object} - {valid: boolean, error: string}
 */
export function validateEmail(email) {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailPattern.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Additional checks
  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  const [localPart, domain] = email.split('@');
  
  if (localPart.length > 64) {
    return { valid: false, error: 'Email local part is too long' };
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return { valid: false, error: 'Email cannot contain consecutive dots' };
  }

  return { valid: true, formatted: email.toLowerCase() };
}

/**
 * Validate tax year
 * @param {string|number} year - Tax year to validate
 * @returns {object} - {valid: boolean, error: string}
 */
export function validateTaxYear(year) {
  if (!year) {
    return { valid: false, error: 'Tax year is required' };
  }

  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear();

  if (isNaN(yearNum)) {
    return { valid: false, error: 'Tax year must be a number' };
  }

  // Dynamic range: 30 years back to 2 years forward
  if (yearNum < (currentYear - 30) || yearNum > (currentYear + 2)) {
    return { valid: false, error: `Tax year must be between ${currentYear - 30} and ${currentYear + 2}` };
  }

  return { valid: true, formatted: yearNum.toString() };
}

/**
 * Validate currency amount
 * @param {string|number} amount - Amount to validate
 * @returns {object} - {valid: boolean, error: string, formatted: string}
 */
export function validateAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return { valid: false, error: 'Amount is required' };
  }

  // Remove commas and spaces
  const cleanAmount = String(amount).replace(/[,\s]/g, '');

  const amountNum = parseFloat(cleanAmount);

  if (isNaN(amountNum)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (amountNum < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }

  if (amountNum > 1e12) {
    return { valid: false, error: 'Amount is too large' };
  }

  // Format with 2 decimal places
  const formatted = amountNum.toFixed(2);

  return { valid: true, formatted };
}

/**
 * Validate all fields in a tax return
 * @param {object} returnData - Tax return data to validate
 * @returns {object} - {valid: boolean, errors: object}
 */
export function validateTaxReturn(returnData) {
  const errors = {};

  // Validate CNIC if provided
  if (returnData.cnic) {
    const cnicValidation = validateCNIC(returnData.cnic);
    if (!cnicValidation.valid) {
      errors.cnic = cnicValidation.error;
    }
  }

  // Validate NTN if provided
  if (returnData.ntn) {
    const ntnValidation = validateNTN(returnData.ntn);
    if (!ntnValidation.valid) {
      errors.ntn = ntnValidation.error;
    }
  }

  // Validate tax year
  if (returnData.tax_year) {
    const yearValidation = validateTaxYear(returnData.tax_year);
    if (!yearValidation.valid) {
      errors.tax_year = yearValidation.error;
    }
  }

  // Validate amounts
  if (returnData.total_income) {
    const incomeValidation = validateAmount(returnData.total_income);
    if (!incomeValidation.valid) {
      errors.total_income = incomeValidation.error;
    }
  }

  if (returnData.tax_paid) {
    const taxValidation = validateAmount(returnData.tax_paid);
    if (!taxValidation.valid) {
      errors.tax_paid = taxValidation.error;
    }
  }

  if (returnData.taxable_income) {
    const taxableValidation = validateAmount(returnData.taxable_income);
    if (!taxableValidation.valid) {
      errors.taxable_income = taxableValidation.error;
    }
  }

  if (returnData.tax_chargeable) {
    const chargeableValidation = validateAmount(returnData.tax_chargeable);
    if (!chargeableValidation.valid) {
      errors.tax_chargeable = chargeableValidation.error;
    }
  }

  if (returnData.refund_amount) {
    const refundValidation = validateAmount(returnData.refund_amount);
    if (!refundValidation.valid) {
      errors.refund_amount = refundValidation.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
