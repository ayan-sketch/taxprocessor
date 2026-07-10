/**
 * Excel Configuration Management
 * Manages Excel workbook paths and configuration for tax return processing
 */

// Excel Workbook Types
export const EXCEL_WORKBOOKS = {
  INDIVIDUAL_SIMPLE: {
    name: 'Return 2025 working  -.xlsm',
    label: 'Individual - Simple Return',
    description: 'Basic individual tax return'
  },
  INDIVIDUAL_CAPITAL_GAIN: {
    name: 'Return 2025 working -- - with capital gain.xlsm',
    label: 'Individual - With Capital Gain',
    description: 'Individual return with capital gains'
  },
  INDIVIDUAL_PL: {
    name: 'Return 2025 working -- - p&l n h.h exp.xlsm',
    label: 'Individual - P&L & Household Expenses',
    description: 'Individual return with profit/loss and household expenses'
  },
  INDIVIDUAL_MINIMUM_TAX: {
    name: 'Return 2025 working -- - minimum tax.xlsm',
    label: 'Individual - Minimum Tax',
    description: 'Individual return with minimum tax calculation'
  },
  INDIVIDUAL_DISTRIBUTORS: {
    name: 'Return 2025 working -- - Distributors turnover.xlsm',
    label: 'Individual - Distributors Turnover',
    description: 'Individual distributor turnover return'
  },
  AOP_STANDARD: {
    name: 'Return 2025 working -- AOP.xlsm',
    label: 'AOP - Standard',
    description: 'Association of Persons standard return'
  },
  AOP_DISTRIBUTORS: {
    name: 'Return 2025 working -- AOP - Copy.xlsm',
    label: 'AOP - Distributors',
    description: 'AOP distributors return'
  },
  AOP_DISTRIBUTORS_TURNOVER: {
    name: 'Return 2025 working -- - AOP DISTRIBUTORS TURNOVER.xlsm',
    label: 'AOP - Distributors Turnover',
    description: 'AOP distributors turnover return'
  },
  COMPANY: {
    name: 'Pakhal construction company.xlsm',
    label: 'Company Return',
    description: 'Company/Corporate tax return'
  }
};

// Default Excel base path
const DEFAULT_EXCEL_PATH = 'C:\\Users\\fgsdfg\\Desktop\\Tax Automation software and website\\income tax return excel working';

/**
 * Get the base path for Excel workbooks
 * @returns {string} Base path for Excel files
 */
export const getExcelBasePath = () => {
  try {
    const savedPath = localStorage.getItem('excelBasePath');
    return savedPath || DEFAULT_EXCEL_PATH;
  } catch (error) {
    console.error('Error getting Excel base path:', error);
    return DEFAULT_EXCEL_PATH;
  }
};

/**
 * Set the base path for Excel workbooks
 * @param {string} path - New base path
 */
export const setExcelBasePath = (path) => {
  try {
    localStorage.setItem('excelBasePath', path);
    localStorage.setItem('excelBasePathUpdated', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error setting Excel base path:', error);
    return false;
  }
};

/**
 * Get the last updated timestamp for Excel path
 * @returns {string|null} ISO timestamp or null
 */
export const getExcelPathLastUpdated = () => {
  try {
    return localStorage.getItem('excelBasePathUpdated');
  } catch (error) {
    return null;
  }
};

/**
 * Reset Excel path to default
 */
export const resetExcelPath = () => {
  try {
    localStorage.removeItem('excelBasePath');
    localStorage.removeItem('excelBasePathUpdated');
    return true;
  } catch (error) {
    console.error('Error resetting Excel path:', error);
    return false;
  }
};

/**
 * Get full path for a specific workbook
 * @param {string} workbookType - Type from EXCEL_WORKBOOKS
 * @returns {string} Full path to workbook
 */
export const getWorkbookPath = (workbookType) => {
  const basePath = getExcelBasePath();
  const workbook = EXCEL_WORKBOOKS[workbookType];
  
  if (!workbook) {
    throw new Error(`Unknown workbook type: ${workbookType}`);
  }
  
  // Use path.join if available (Electron), otherwise manual concatenation
  if (typeof window !== 'undefined' && window.require) {
    try {
      const path = window.require('path');
      return path.join(basePath, workbook.name);
    } catch (error) {
      console.warn('Path module not available, using manual concatenation');
    }
  }
  
  // Manual path concatenation
  return `${basePath}\\${workbook.name}`;
};

/**
 * Validate if Excel path exists and is accessible
 * @param {string} path - Path to validate
 * @returns {Promise<boolean>} True if valid
 */
export const validateExcelPath = async (path) => {
  if (typeof window !== 'undefined' && window.require) {
    try {
      const fs = window.require('fs').promises;
      await fs.access(path);
      return true;
    } catch (error) {
      return false;
    }
  }
  return true; // Assume valid if can't check
};

/**
 * Get list of all available workbooks
 * @returns {Array} Array of workbook objects
 */
export const getAvailableWorkbooks = () => {
  return Object.entries(EXCEL_WORKBOOKS).map(([key, value]) => ({
    key,
    ...value
  }));
};

export default {
  EXCEL_WORKBOOKS,
  getExcelBasePath,
  setExcelBasePath,
  getExcelPathLastUpdated,
  resetExcelPath,
  getWorkbookPath,
  validateExcelPath,
  getAvailableWorkbooks
};
