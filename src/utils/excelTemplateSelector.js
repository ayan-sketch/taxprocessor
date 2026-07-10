/**
 * Excel Template Selector Utility
 * Automatically selects the appropriate Excel template based on client data
 */

import { EXCEL_WORKBOOKS, getExcelBasePath } from './excelConfig';

/**
 * Select appropriate Excel template based on client information
 * @param {Object} clientData - Client data object
 * @returns {Object} Selected template info with path
 */
export const selectTemplateForClient = (clientData) => {
  if (!clientData) {
    return {
      workbookType: 'INDIVIDUAL_SIMPLE',
      workbook: EXCEL_WORKBOOKS.INDIVIDUAL_SIMPLE,
      reason: 'Default template selected (no client data provided)'
    };
  }

  const { person, sourceOfIncome, businessType, businessClassification } = clientData;
  const source = (sourceOfIncome || '').toLowerCase();
  const type = (businessType || '').toLowerCase();
  const classification = (businessClassification || '').toLowerCase();
  
  let workbookType = 'INDIVIDUAL_SIMPLE';
  let reason = 'Default individual return';

  // Company returns
  if (person === 'Company' || type === 'company' || type === 'corporation' || classification.includes('company')) {
    workbookType = 'COMPANY';
    reason = 'Company/Corporate tax return selected based on entity type';
  }
  // AOP returns
  else if (person === 'AOP' || type === 'aop' || classification.includes('aop')) {
    if (source.includes('distributor')) {
      if (source.includes('turnover')) {
        workbookType = 'AOP_DISTRIBUTORS_TURNOVER';
        reason = 'AOP Distributors with turnover calculation';
      } else {
        workbookType = 'AOP_DISTRIBUTORS';
        reason = 'AOP Distributors return';
      }
    } else {
      workbookType = 'AOP_STANDARD';
      reason = 'AOP standard return';
    }
  }
  // Individual returns
  else if (person === 'Individual' || type === 'individual' || !person) {
    // Check for capital gains
    if (source.includes('capital gain') || source.includes('capital') || source.includes('investment')) {
      workbookType = 'INDIVIDUAL_CAPITAL_GAIN';
      reason = 'Individual return with capital gains';
    }
    // Check for business/P&L
    else if (source.includes('business') || source.includes('p&l') || source.includes('profit') || 
             source.includes('household') || classification.includes('business')) {
      workbookType = 'INDIVIDUAL_PL';
      reason = 'Individual return with P&L and household expenses';
    }
    // Check for minimum tax
    else if (source.includes('minimum tax') || source.includes('minimum')) {
      workbookType = 'INDIVIDUAL_MINIMUM_TAX';
      reason = 'Individual return with minimum tax calculation';
    }
    // Check for distributors
    else if (source.includes('distributor') || source.includes('turnover')) {
      workbookType = 'INDIVIDUAL_DISTRIBUTORS';
      reason = 'Individual distributors turnover return';
    }
    // Salary only
    else if (source.includes('salary') || source.includes('employment')) {
      workbookType = 'INDIVIDUAL_SIMPLE';
      reason = 'Simple individual return (salary income)';
    }
    // Default individual
    else {
      workbookType = 'INDIVIDUAL_SIMPLE';
      reason = 'Simple individual return (default)';
    }
  }

  const workbook = EXCEL_WORKBOOKS[workbookType];

  return {
    workbookType,
    workbook,
    reason
  };
};

/**
 * Get full path to the selected template
 * @param {string} workbookType - Workbook type key from EXCEL_WORKBOOKS
 * @returns {string} Full path to the template file
 */
export const getTemplatePath = (workbookType) => {
  const basePath = getExcelBasePath();
  const workbook = EXCEL_WORKBOOKS[workbookType];
  
  if (!workbook) {
    throw new Error(`Invalid workbook type: ${workbookType}`);
  }

  // Use path.join if available (Node.js environment)
  if (typeof window !== 'undefined' && window.require) {
    try {
      const path = window.require('path');
      return path.join(basePath, workbook.name);
    } catch (error) {
      console.warn('Path module not available, using manual concatenation');
    }
  }
  
  // Manual path concatenation as fallback
  return `${basePath}\\${workbook.name}`;
};

/**
 * Get template recommendation with full path
 * @param {Object} clientData - Client data object
 * @returns {Object} Template recommendation with path
 */
export const getTemplateRecommendation = (clientData) => {
  const selection = selectTemplateForClient(clientData);
  const templatePath = getTemplatePath(selection.workbookType);

  return {
    ...selection,
    templatePath
  };
};

/**
 * Get all available templates with paths
 * @returns {Array} Array of all templates with paths
 */
export const getAllTemplates = () => {
  return Object.entries(EXCEL_WORKBOOKS).map(([key, value]) => ({
    workbookType: key,
    workbook: value,
    templatePath: getTemplatePath(key)
  }));
};

export default {
  selectTemplateForClient,
  getTemplatePath,
  getTemplateRecommendation,
  getAllTemplates
};
