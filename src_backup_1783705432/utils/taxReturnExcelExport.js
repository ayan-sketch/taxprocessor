import * as XLSX from 'xlsx';

/**
 * Tax Return Excel Export Utility
 * Provides multiple export formats for tax return data
 */

// Export format types
export const EXPORT_FORMATS = {
  STANDARD: 'standard',
  FBR_SUBMISSION: 'fbr_submission',
  CLIENT_SUMMARY: 'client_summary',
  AUDIT_TRAIL: 'audit_trail'
};

/**
 * Export tax returns to Excel with selected format
 * @param {Array} returns - Array of tax return objects
 * @param {String} format - Export format type
 * @param {Object} options - Additional options
 */
export const exportTaxReturns = (returns, format = EXPORT_FORMATS.STANDARD, options = {}) => {
  const {
    fileName = `tax_returns_${new Date().toISOString().split('T')[0]}.xlsx`,
    includeHeaders = true,
    selectedColumns = null
  } = options;

  try {
    const workbook = XLSX.utils.book_new();
    
    switch (format) {
      case EXPORT_FORMATS.STANDARD:
        addStandardSheet(workbook, returns, includeHeaders, selectedColumns);
        break;
      case EXPORT_FORMATS.FBR_SUBMISSION:
        addFBRSubmissionSheet(workbook, returns);
        break;
      case EXPORT_FORMATS.CLIENT_SUMMARY:
        addClientSummarySheet(workbook, returns);
        break;
      case EXPORT_FORMATS.AUDIT_TRAIL:
        addAuditTrailSheet(workbook, returns);
        break;
      default:
        addStandardSheet(workbook, returns, includeHeaders, selectedColumns);
    }
    
    // Write file
    XLSX.writeFile(workbook, fileName);
    
    return {
      success: true,
      fileName: fileName,
      recordCount: returns.length,
      format: format
    };
    
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Standard format export
 */
const addStandardSheet = (workbook, returns, includeHeaders, selectedColumns) => {
  const headers = [
    'ID',
    'Original Filename',
    'Renamed Filename',
    'Client Name',
    'CNIC/NTN',
    'Tax Year',
    'Return Type',
    'Filing Date',
    'Total Income',
    'Taxable Income',
    'Tax Chargeable',
    'Tax Paid',
    'Refund Amount',
    'Refund Section',
    'Status',
    'Total Pages',
    'Processed Date',
    'File Location'
  ];
  
  const data = [];
  
  if (includeHeaders) {
    data.push(headers);
  }
  
  returns.forEach(ret => {
    data.push([
      ret.id || '',
      ret.original_filename || '',
      ret.renamed_filename || '',
      ret.client_name || '',
      ret.cnic_ntn || ret.cnic || ret.ntn || '',
      ret.tax_year || '',
      ret.return_type || '',
      ret.filing_date || '',
      ret.total_income || '',
      ret.taxable_income || '',
      ret.tax_chargeable || '',
      ret.tax_paid || '',
      ret.refund_amount || '',
      ret.refund_section || '',
      ret.status || '',
      ret.total_pages || '',
      ret.processed_date || ret.processed_at || '',
      ret.file_path || ret.file_location || ''
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },   // ID
    { wch: 50 },  // Original Filename
    { wch: 50 },  // Renamed Filename
    { wch: 30 },  // Client Name
    { wch: 20 },  // CNIC/NTN
    { wch: 10 },  // Tax Year
    { wch: 35 },  // Return Type
    { wch: 15 },  // Filing Date
    { wch: 15 },  // Total Income
    { wch: 15 },  // Taxable Income
    { wch: 15 },  // Tax Chargeable
    { wch: 15 },  // Tax Paid
    { wch: 15 },  // Refund Amount
    { wch: 20 },  // Refund Section
    { wch: 12 },  // Status
    { wch: 10 },  // Total Pages
    { wch: 20 },  // Processed Date
    { wch: 60 }   // File Location
  ];
  
  // Apply styling (if supported)
  if (includeHeaders && data.length > 0) {
    // Header row styling would go here
    // Note: XLSX library has limited styling support
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tax Returns');
};

/**
 * FBR Submission format export
 */
const addFBRSubmissionSheet = (workbook, returns) => {
  const headers = [
    'S.No',
    'Taxpayer Name',
    'CNIC',
    'NTN',
    'Tax Year',
    'Return Type',
    'Filing Date',
    'Status',
    'Acknowledgment No',
    'Remarks'
  ];
  
  const data = [headers];
  
  returns.forEach((ret, index) => {
    // Extract CNIC and NTN separately
    const cnicNtn = ret.cnic_ntn || ret.cnic || ret.ntn || '';
    const isCNIC = cnicNtn.includes('-') && cnicNtn.split('-').length === 3;
    
    data.push([
      index + 1,
      ret.client_name || '',
      isCNIC ? cnicNtn : '',
      !isCNIC ? cnicNtn : '',
      ret.tax_year || '',
      ret.return_type || 'Income Tax Return',
      ret.filing_date || '',
      ret.status || 'Filed',
      '', // Acknowledgment No - to be filled
      ''  // Remarks
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  worksheet['!cols'] = [
    { wch: 8 },   // S.No
    { wch: 35 },  // Taxpayer Name
    { wch: 20 },  // CNIC
    { wch: 15 },  // NTN
    { wch: 10 },  // Tax Year
    { wch: 30 },  // Return Type
    { wch: 15 },  // Filing Date
    { wch: 12 },  // Status
    { wch: 20 },  // Acknowledgment No
    { wch: 30 }   // Remarks
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'FBR Submission');
};

/**
 * Client Summary format export
 */
const addClientSummarySheet = (workbook, returns) => {
  // Group returns by client
  const clientGroups = returns.reduce((acc, ret) => {
    const clientName = ret.client_name || 'Unknown';
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(ret);
    return acc;
  }, {});
  
  const headers = [
    'Client Name',
    'CNIC/NTN',
    'Total Returns Filed',
    'Tax Years',
    'Latest Filing Date',
    'Status Summary'
  ];
  
  const data = [headers];
  
  Object.entries(clientGroups).forEach(([clientName, clientReturns]) => {
    const taxYears = [...new Set(clientReturns.map(r => r.tax_year))].join(', ');
    const latestDate = clientReturns
      .map(r => r.filing_date || r.processed_date)
      .filter(Boolean)
      .sort()
      .reverse()[0] || '';
    
    const statusCounts = clientReturns.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    const statusSummary = Object.entries(statusCounts)
      .map(([status, count]) => `${status}: ${count}`)
      .join(', ');
    
    data.push([
      clientName,
      clientReturns[0].cnic_ntn || clientReturns[0].cnic || clientReturns[0].ntn || '',
      clientReturns.length,
      taxYears,
      latestDate,
      statusSummary
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  worksheet['!cols'] = [
    { wch: 35 },  // Client Name
    { wch: 20 },  // CNIC/NTN
    { wch: 18 },  // Total Returns Filed
    { wch: 25 },  // Tax Years
    { wch: 20 },  // Latest Filing Date
    { wch: 30 }   // Status Summary
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Summary');
};

/**
 * Audit Trail format export
 */
const addAuditTrailSheet = (workbook, returns) => {
  const headers = [
    'ID',
    'Timestamp',
    'Client Name',
    'CNIC/NTN',
    'Tax Year',
    'Original Filename',
    'Renamed Filename',
    'Action',
    'Status',
    'Processed By',
    'Processing Duration',
    'File Size',
    'Pages',
    'Validation Status',
    'Error Messages',
    'File Location'
  ];
  
  const data = [headers];
  
  returns.forEach(ret => {
    const processedDate = ret.processed_date || ret.processed_at || '';
    const timestamp = processedDate ? new Date(processedDate).toLocaleString() : '';
    
    data.push([
      ret.id || '',
      timestamp,
      ret.client_name || '',
      ret.cnic_ntn || ret.cnic || ret.ntn || '',
      ret.tax_year || '',
      ret.original_filename || '',
      ret.renamed_filename || '',
      'PDF Processed & Renamed',
      ret.status || 'Processed',
      'System Auto-Processor',
      ret.processing_duration || 'N/A',
      ret.file_size || 'N/A',
      ret.total_pages || '',
      ret.validation_status || 'Valid',
      ret.errors || '',
      ret.file_path || ret.file_location || ''
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  worksheet['!cols'] = [
    { wch: 8 },   // ID
    { wch: 20 },  // Timestamp
    { wch: 30 },  // Client Name
    { wch: 20 },  // CNIC/NTN
    { wch: 10 },  // Tax Year
    { wch: 45 },  // Original Filename
    { wch: 45 },  // Renamed Filename
    { wch: 25 },  // Action
    { wch: 12 },  // Status
    { wch: 20 },  // Processed By
    { wch: 18 },  // Processing Duration
    { wch: 12 },  // File Size
    { wch: 8 },   // Pages
    { wch: 15 },  // Validation Status
    { wch: 40 },  // Error Messages
    { wch: 60 }   // File Location
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trail');
};

/**
 * Export filtered returns based on criteria
 * @param {Array} returns - All returns
 * @param {Object} filters - Filter criteria
 * @param {String} format - Export format
 */
export const exportFilteredReturns = (returns, filters, format) => {
  let filtered = [...returns];
  
  // Apply filters
  if (filters.taxYear) {
    filtered = filtered.filter(r => r.tax_year === filters.taxYear);
  }
  
  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status);
  }
  
  if (filters.clientName) {
    filtered = filtered.filter(r => 
      r.client_name?.toLowerCase().includes(filters.clientName.toLowerCase())
    );
  }
  
  if (filters.dateFrom) {
    filtered = filtered.filter(r => {
      const fileDate = new Date(r.filing_date || r.processed_date);
      return fileDate >= new Date(filters.dateFrom);
    });
  }
  
  if (filters.dateTo) {
    filtered = filtered.filter(r => {
      const fileDate = new Date(r.filing_date || r.processed_date);
      return fileDate <= new Date(filters.dateTo);
    });
  }
  
  return exportTaxReturns(filtered, format, {
    fileName: `filtered_tax_returns_${new Date().toISOString().split('T')[0]}.xlsx`
  });
};

/**
 * Get available export formats
 */
export const getExportFormats = () => {
  return [
    { id: EXPORT_FORMATS.STANDARD, name: 'Standard Format', description: 'Complete data with all fields' },
    { id: EXPORT_FORMATS.FBR_SUBMISSION, name: 'FBR Submission Format', description: 'Format for FBR submission' },
    { id: EXPORT_FORMATS.CLIENT_SUMMARY, name: 'Client Summary', description: 'Grouped by client with statistics' },
    { id: EXPORT_FORMATS.AUDIT_TRAIL, name: 'Audit Trail', description: 'Detailed processing log for audits' }
  ];
};

export default {
  exportTaxReturns,
  exportFilteredReturns,
  getExportFormats,
  EXPORT_FORMATS
};
