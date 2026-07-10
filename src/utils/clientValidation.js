// Client data validation utilities

/**
 * Auto-format CNIC as user types: xxxxx-xxxxxxx-x
 * Strips non-digits, inserts dashes at positions 5 and 12
 * @param {string} raw - Raw CNIC input
 * @returns {string} - Formatted CNIC
 */
export const formatCNIC = (raw) => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

/**
 * Validates CNIC format (xxxxx-xxxxxxx-x)
 * @param {string} cnic - CNIC to validate
 * @returns {boolean} - True if valid
 */
export const validateCNIC = (cnic) => {
  if (!cnic) return false;
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  return cnicRegex.test(cnic.trim());
};

/**
 * Validates NTN format (7 digits, optionally with dash and check digit)
 * @param {string} ntn - NTN to validate
 * @returns {boolean} - True if valid
 */
export const validateNTN = (ntn) => {
  if (!ntn) return false;
  const ntnRegex = /^\d{7}(-\d)?$/;
  return ntnRegex.test(ntn.trim());
};

/**
 * Validates CNIC or NTN
 * @param {string} value - CNIC/NTN to validate
 * @returns {object} - {isValid: boolean, type: 'CNIC'|'NTN'|null, error: string}
 */
export const validateCNICOrNTN = (value) => {
  if (!value || !value.trim()) {
    return { isValid: false, type: null, error: 'CNIC/NTN is required' };
  }

  const trimmedValue = value.trim();

  // Check if it's a valid CNIC
  if (validateCNIC(trimmedValue)) {
    return { isValid: true, type: 'CNIC', error: null };
  }

  // Check if it's a valid NTN
  if (validateNTN(trimmedValue)) {
    return { isValid: true, type: 'NTN', error: null };
  }

  return {
    isValid: false,
    type: null,
    error: 'Invalid format. CNIC: xxxxx-xxxxxxx-x or NTN: 7 digits'
  };
};

/**
 * Validates Pakistani phone number
 * @param {string} phone - Phone number to validate
 * @returns {object} - {isValid: boolean, error: string}
 */
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const trimmedPhone = phone.trim().replace(/[\s\-()]/g, '');

  // Pakistani phone formats: 03xxxxxxxxx or +923xxxxxxxxx or 923xxxxxxxxx
  const phoneRegex = /^(\+92|92|0)?3\d{9}$/;

  if (phoneRegex.test(trimmedPhone)) {
    return { isValid: true, error: null };
  }

  return {
    isValid: false,
    error: 'Invalid phone format. Use: 03xxxxxxxxx or +923xxxxxxxxx'
  };
};

/**
 * Check a single client field against existing clients for duplicates.
 * Returns an array of matching clients (empty if no duplicates).
 * @param {string} field - Field name to check ('fileNo', 'cnic', 'ntn', 'phone')
 * @param {string} value - The value to check
 * @param {Array} existingClients - Array of existing client objects
 * @param {number|null} excludeId - Client ID to exclude (for editing)
 * @returns {Array} - Array of matching client objects
 */
export const checkDuplicateField = (field, value, existingClients, excludeId = null) => {
  if (!value || !value.trim()) return [];
  const normalised = value.trim().toLowerCase().replace(/[\s\-]/g, '');
  if (!normalised) return [];

  return existingClients.filter(c => {
    if (excludeId && c.id === excludeId) return false;
    const existing = (c[field] || '').trim().toLowerCase().replace(/[\s\-]/g, '');
    return existing && existing === normalised;
  });
};

/**
 * Real-time duplicate check across all key fields.
 * Call this while the user is typing to surface warnings before submission.
 * @param {object} formData - Current form values {fileNo, cnic, ntn, phone}
 * @param {Array} existingClients - Existing client array
 * @param {number|null} excludeId - Client ID to exclude when editing
 * @returns {object} - { hasDuplicates: boolean, duplicates: { fileNo: [], cnic: [], ntn: [], phone: [] } }
 */
export const checkAllDuplicates = (formData, existingClients, excludeId = null) => {
  const duplicates = {
    fileNo: checkDuplicateField('fileNo', formData.fileNo, existingClients, excludeId),
    cnic: checkDuplicateField('cnic', formData.cnic, existingClients, excludeId),
    ntn: checkDuplicateField('ntn', formData.ntn, existingClients, excludeId),
    phone: checkDuplicateField('phone', formData.phone, existingClients, excludeId),
  };

  const hasDuplicates = Object.values(duplicates).some(arr => arr.length > 0);
  return { hasDuplicates, duplicates };
};

/**
 * Validates a single client row from Excel
 * @param {object} row - Client data row
 * @param {number} rowIndex - Row number for error reporting
 * @param {Array} existingClients - Existing clients for duplicate checking
 * @returns {object} - {isValid: boolean, errors: array, warnings: array, data: object}
 */
export const validateClientRow = (row, rowIndex, existingClients = []) => {
  const errors = [];
  const warnings = [];
  const data = {
    sNo: row['S.No'] || rowIndex,
    fileNo: row['File No'] || '',
    name: row['Name'] || '',
    cnicNtn: row['CNIC/NTN'] || '',
    phone: row['Phone Number'] || '',
    address: row['Address'] || '',
    linkId: row['Link ID'] || ''
  };

  // Validate required fields
  if (!data.name || !data.name.trim()) {
    errors.push('Name is required');
  }

  // Validate CNIC/NTN format
  if (data.cnicNtn) {
    const cnicNtnValidation = validateCNICOrNTN(data.cnicNtn);
    if (!cnicNtnValidation.isValid) {
      errors.push(cnicNtnValidation.error);
    }
  }

  // Validate Phone format
  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.error);
    }
  }

  // Duplicate checks against existing clients
  if (existingClients.length > 0) {
    if (data.fileNo) {
      const dupFileNo = checkDuplicateField('fileNo', data.fileNo, existingClients);
      if (dupFileNo.length > 0) {
        warnings.push(`Duplicate File No "${data.fileNo}" – already used by: ${dupFileNo.map(c => c.name).join(', ')}`);
      }
    }

    if (data.cnicNtn) {
      // Check both cnic and ntn fields
      const dupCnic = checkDuplicateField('cnic', data.cnicNtn, existingClients);
      const dupNtn = checkDuplicateField('ntn', data.cnicNtn, existingClients);
      const allDups = [...dupCnic, ...dupNtn];
      if (allDups.length > 0) {
        warnings.push(`Duplicate CNIC/NTN "${data.cnicNtn}" – already used by: ${allDups.map(c => c.name).join(', ')}`);
      }
    }

    if (data.phone) {
      const dupPhone = checkDuplicateField('phone', data.phone, existingClients);
      if (dupPhone.length > 0) {
        warnings.push(`Duplicate Phone "${data.phone}" – already used by: ${dupPhone.map(c => c.name).join(', ')}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data,
    rowNumber: rowIndex
  };
};

/**
 * Validates all client rows from Excel
 * @param {array} rows - Array of client data rows
 * @param {Array} existingClients - Existing clients for duplicate checking
 * @returns {object} - {validRows: array, invalidRows: array, warningRows: array, summary: object}
 */
export const validateAllClients = (rows, existingClients = []) => {
  const validRows = [];
  const invalidRows = [];
  const warningRows = [];

  rows.forEach((row, index) => {
    const validation = validateClientRow(row, index + 2, existingClients); // +2 because Excel starts at 1 and has header

    if (validation.isValid) {
      validRows.push({
        ...validation.data,
        rowNumber: validation.rowNumber,
        warnings: validation.warnings
      });
      if (validation.warnings.length > 0) {
        warningRows.push({
          ...validation.data,
          rowNumber: validation.rowNumber,
          warnings: validation.warnings
        });
      }
    } else {
      invalidRows.push({
        ...validation.data,
        rowNumber: validation.rowNumber,
        errors: validation.errors,
        warnings: validation.warnings
      });
    }
  });

  return {
    validRows,
    invalidRows,
    warningRows,
    summary: {
      total: rows.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      warnings: warningRows.length,
      successRate: rows.length > 0 ? ((validRows.length / rows.length) * 100).toFixed(1) : 0
    }
  };
};
