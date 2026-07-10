/**
 * Excel Opener Utility
 * Handles opening Excel workbooks using Electron shell
 */

import { getWorkbookPath, EXCEL_WORKBOOKS } from './excelConfig';
import { requireElectronFeature } from './environmentDetector';

/**
 * Open an Excel workbook
 * @param {string} workbookType - Type from EXCEL_WORKBOOKS
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result object with success status
 */
export const openExcelWorkbook = async (workbookType, options = {}) => {
  try {
    // Require Electron environment with clear error message
    requireElectronFeature('openExcelFile', 'Excel file opening');
    
    // Get the full path to the workbook
    const workbookPath = getWorkbookPath(workbookType);
    
    console.log(`Opening Excel workbook: ${workbookPath}`);
    
    // Open the file using Electron API
    const result = await window.electronAPI.openExcelFile(workbookPath);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to open Excel file');
    }
    
    return {
      success: true,
      path: workbookPath,
      workbookType,
      message: `Successfully opened ${EXCEL_WORKBOOKS[workbookType].label}`
    };
    
  } catch (error) {
    console.error('Error opening Excel workbook:', error);
    return {
      success: false,
      error: error.message,
      workbookType,
      message: `Failed to open Excel workbook: ${error.message}`
    };
  }
};

/**
 * Select appropriate workbook based on client data
 * @param {Object} client - Client object with person and sourceOfIncome
 * @returns {string} Workbook type key
 */
export const selectWorkbookForClient = (client) => {
  if (!client) {
    return 'INDIVIDUAL_SIMPLE'; // Default
  }

  const { person, sourceOfIncome, businessType } = client;
  const source = (sourceOfIncome || '').toLowerCase();
  const type = (businessType || '').toLowerCase();
  
  // Company returns
  if (person === 'Company' || type === 'company' || type === 'corporation') {
    return 'COMPANY';
  }
  
  // AOP returns
  if (person === 'AOP' || type === 'aop') {
    if (source.includes('distributor')) {
      // Check if it's turnover-based
      if (source.includes('turnover')) {
        return 'AOP_DISTRIBUTORS_TURNOVER';
      }
      return 'AOP_DISTRIBUTORS';
    }
    return 'AOP_STANDARD';
  }
  
  // Individual returns
  if (person === 'Individual' || type === 'individual') {
    // Check for capital gains
    if (source.includes('capital gain') || source.includes('capital')) {
      return 'INDIVIDUAL_CAPITAL_GAIN';
    }
    
    // Check for business/P&L
    if (source.includes('business') || source.includes('p&l') || source.includes('profit')) {
      return 'INDIVIDUAL_PL';
    }
    
    // Check for minimum tax
    if (source.includes('minimum tax')) {
      return 'INDIVIDUAL_MINIMUM_TAX';
    }
    
    // Check for distributors
    if (source.includes('distributor')) {
      return 'INDIVIDUAL_DISTRIBUTORS';
    }
    
    // Default individual return
    return 'INDIVIDUAL_SIMPLE';
  }
  
  // Default fallback
  return 'INDIVIDUAL_SIMPLE';
};

/**
 * Open Excel workbook for a specific client
 * @param {Object} client - Client object
 * @returns {Promise<Object>} Result object
 */
export const openExcelForClient = async (client) => {
  const workbookType = selectWorkbookForClient(client);
  return await openExcelWorkbook(workbookType, { client });
};

/**
 * Check if Excel is available
 * @returns {Promise<boolean>} True if Excel can be opened
 */
export const isExcelAvailable = async () => {
  try {
    if (typeof window === 'undefined' || !window.electronAPI || !window.electronAPI.openExcelFile) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Excel availability:', error);
    return false;
  }
};

/**
 * Get workbook recommendation for client
 * @param {Object} client - Client object
 * @returns {Object} Recommendation object with workbook info
 */
export const getWorkbookRecommendation = (client) => {
  const workbookType = selectWorkbookForClient(client);
  const workbook = EXCEL_WORKBOOKS[workbookType];
  
  return {
    workbookType,
    workbook,
    reason: getRecommendationReason(client, workbookType)
  };
};

/**
 * Get reason for workbook recommendation
 * @param {Object} client - Client object
 * @param {string} workbookType - Selected workbook type
 * @returns {string} Reason for recommendation
 */
const getRecommendationReason = (client, workbookType) => {
  const { person, sourceOfIncome } = client || {};
  
  if (workbookType === 'COMPANY') {
    return 'Company/Corporate tax return selected based on entity type';
  }
  
  if (workbookType.startsWith('AOP')) {
    if (workbookType.includes('DISTRIBUTORS')) {
      return 'AOP Distributors return selected based on income source';
    }
    return 'AOP standard return selected based on entity type';
  }
  
  if (workbookType === 'INDIVIDUAL_CAPITAL_GAIN') {
    return 'Individual return with capital gains selected';
  }
  
  if (workbookType === 'INDIVIDUAL_PL') {
    return 'Individual return with P&L selected for business income';
  }
  
  if (workbookType === 'INDIVIDUAL_MINIMUM_TAX') {
    return 'Individual return with minimum tax calculation selected';
  }
  
  if (workbookType === 'INDIVIDUAL_DISTRIBUTORS') {
    return 'Individual distributors return selected';
  }
  
  return 'Simple individual return selected as default';
};

export default {
  openExcelWorkbook,
  selectWorkbookForClient,
  openExcelForClient,
  isExcelAvailable,
  getWorkbookRecommendation
};
