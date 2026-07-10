import * as XLSX from 'xlsx';

/**
 * Export tax returns data to Excel format
 * @param {Array} returns - Array of tax return objects
 * @param {string} filename - Output filename
 */
export function exportToExcel(returns, filename = 'tax_returns_export.xlsx') {
  try {
    if (!returns || !Array.isArray(returns) || returns.length === 0) {
      throw new Error('No data to export');
    }

    // Prepare data for export
    const exportData = returns.map((ret, index) => ({
      'Sr. No': index + 1,
      'Name': ret.name || '',
      'CNIC/NTN': ret.cnicNtn || '',
      'Tax Year': ret.taxYear || '',
      'Status': ret.status || 'Pending',
      'Income Amount': ret.incomeAmount || '',
      'Tax Paid': ret.taxPaid || '',
      'Refund Amount': ret.refundAmount || '',
      'Filing Date': ret.filingDate || '',
      'Deadline': ret.deadline || '',
      'Email': ret.email || '',
      'Phone': ret.phone || '',
      'Address': ret.address || '',
      'Notes': ret.notes || '',
      'File Path': ret.filePath || '',
      'Processed Date': ret.processedDate || new Date().toLocaleDateString()
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 8 },  // Sr. No
      { wch: 25 }, // Name
      { wch: 15 }, // CNIC/NTN
      { wch: 10 }, // Tax Year
      { wch: 12 }, // Status
      { wch: 15 }, // Income Amount
      { wch: 12 }, // Tax Paid
      { wch: 15 }, // Refund Amount
      { wch: 12 }, // Filing Date
      { wch: 12 }, // Deadline
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 30 }, // Address
      { wch: 30 }, // Notes
      { wch: 40 }, // File Path
      { wch: 15 }  // Processed Date
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Tax Returns');

    // Generate and download file
    XLSX.writeFile(wb, filename);
    
    return { success: true, count: returns.length };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}

/**
 * Export tax returns data to CSV format
 * @param {Array} returns - Array of tax return objects
 * @param {string} filename - Output filename
 */
export function exportToCSV(returns, filename = 'tax_returns_export.csv') {
  try {
    if (!returns || !Array.isArray(returns) || returns.length === 0) {
      throw new Error('No data to export');
    }

    // Prepare data for export
    const exportData = returns.map((ret, index) => ({
      'Sr. No': index + 1,
      'Name': ret.name || '',
      'CNIC/NTN': ret.cnicNtn || '',
      'Tax Year': ret.taxYear || '',
      'Status': ret.status || 'Pending',
      'Income Amount': ret.incomeAmount || '',
      'Tax Paid': ret.taxPaid || '',
      'Refund Amount': ret.refundAmount || '',
      'Filing Date': ret.filingDate || '',
      'Deadline': ret.deadline || '',
      'Email': ret.email || '',
      'Phone': ret.phone || '',
      'Address': ret.address || '',
      'Notes': ret.notes || '',
      'File Path': ret.filePath || '',
      'Processed Date': ret.processedDate || new Date().toLocaleDateString()
    }));

    // Create workbook and convert to CSV
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Tax Returns');

    // Generate and download CSV file
    XLSX.writeFile(wb, filename, { bookType: 'csv' });
    
    return { success: true, count: returns.length };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
}

/**
 * Generate monthly summary report
 * @param {Array} returns - Array of tax return objects
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 */
export function generateMonthlySummary(returns, month, year) {
  if (!returns || !Array.isArray(returns)) {
    return {
      month,
      year,
      totalReturns: 0,
      statusBreakdown: {},
      totalIncome: 0,
      totalTax: 0,
      totalRefunds: 0,
      avgIncome: 0,
      avgTax: 0
    };
  }

  const monthlyReturns = returns.filter(ret => {
    const processedDate = new Date(ret.processed_date || ret.processedDate || ret.filing_date || ret.filingDate);
    return processedDate.getMonth() + 1 === month && processedDate.getFullYear() === year;
  });

  const summary = {
    month,
    year,
    totalReturns: monthlyReturns.length,
    statusBreakdown: {},
    totalIncome: 0,
    totalTaxPaid: 0,
    totalRefunds: 0,
    averageIncome: 0,
    returns: monthlyReturns
  };

  monthlyReturns.forEach(ret => {
    // Status breakdown
    const status = ret.status || 'Pending';
    summary.statusBreakdown[status] = (summary.statusBreakdown[status] || 0) + 1;

    // Financial totals
    summary.totalIncome += parseFloat(ret.incomeAmount || 0);
    summary.totalTaxPaid += parseFloat(ret.taxPaid || 0);
    summary.totalRefunds += parseFloat(ret.refundAmount || 0);
  });

  summary.averageIncome = monthlyReturns.length > 0 
    ? summary.totalIncome / monthlyReturns.length 
    : 0;

  return summary;
}

/**
 * Generate yearly summary report
 * @param {Array} returns - Array of tax return objects
 * @param {number} year - Year
 */
export function generateYearlySummary(returns, year) {
  if (!returns || !Array.isArray(returns)) {
    return {
      year,
      totalReturns: 0,
      statusBreakdown: {},
      totalIncome: 0,
      totalTax: 0,
      totalRefunds: 0,
      avgIncome: 0,
      avgTax: 0,
      monthlyBreakdown: []
    };
  }

  const yearlyReturns = returns.filter(ret => {
    const processedDate = new Date(ret.processed_date || ret.processedDate || ret.filing_date || ret.filingDate);
    return processedDate.getFullYear() === year;
  });

  const summary = {
    year,
    totalReturns: yearlyReturns.length,
    statusBreakdown: {},
    monthlyBreakdown: {},
    totalIncome: 0,
    totalTaxPaid: 0,
    totalRefunds: 0,
    averageIncome: 0,
    returns: yearlyReturns
  };

  yearlyReturns.forEach(ret => {
    // Status breakdown
    const status = ret.status || 'Pending';
    summary.statusBreakdown[status] = (summary.statusBreakdown[status] || 0) + 1;

    // Monthly breakdown
    const processedDate = new Date(ret.processedDate || ret.filingDate);
    const month = processedDate.getMonth() + 1;
    summary.monthlyBreakdown[month] = (summary.monthlyBreakdown[month] || 0) + 1;

    // Financial totals
    summary.totalIncome += parseFloat(ret.incomeAmount || 0);
    summary.totalTaxPaid += parseFloat(ret.taxPaid || 0);
    summary.totalRefunds += parseFloat(ret.refundAmount || 0);
  });

  summary.averageIncome = yearlyReturns.length > 0 
    ? summary.totalIncome / yearlyReturns.length 
    : 0;

  return summary;
}

/**
 * Generate client-wise return history report
 * @param {Array} returns - Array of tax return objects
 * @param {string} cnicNtn - Client CNIC/NTN
 */
export function generateClientHistory(returns, cnicNtn) {
  if (!returns || !Array.isArray(returns)) {
    return {
      cnicNtn,
      name: '',
      totalReturns: 0,
      returns: [],
      totalIncome: 0,
      totalTax: 0,
      totalRefunds: 0,
      avgIncome: 0,
      avgTax: 0
    };
  }

  const clientReturns = returns.filter(ret => (ret.cnic_ntn || ret.cnicNtn || ret.cnic) === cnicNtn);
  
  // Sort by tax year descending
  clientReturns.sort((a, b) => {
    const yearA = parseInt(a.taxYear) || 0;
    const yearB = parseInt(b.taxYear) || 0;
    return yearB - yearA;
  });

  const history = {
    cnicNtn,
    clientName: clientReturns[0]?.name || '',
    totalReturns: clientReturns.length,
    years: clientReturns.map(ret => ret.taxYear),
    totalIncome: 0,
    totalTaxPaid: 0,
    totalRefunds: 0,
    returns: clientReturns
  };

  clientReturns.forEach(ret => {
    history.totalIncome += parseFloat(ret.incomeAmount || 0);
    history.totalTaxPaid += parseFloat(ret.taxPaid || 0);
    history.totalRefunds += parseFloat(ret.refundAmount || 0);
  });

  return history;
}

/**
 * Export client history to Excel
 * @param {Object} history - Client history object
 * @param {string} filename - Output filename
 */
export function exportClientHistory(history, filename) {
  try {
    const exportData = history.returns.map((ret, index) => ({
      'Sr. No': index + 1,
      'Tax Year': ret.taxYear || '',
      'Status': ret.status || 'Pending',
      'Income Amount': ret.incomeAmount || '',
      'Tax Paid': ret.taxPaid || '',
      'Refund Amount': ret.refundAmount || '',
      'Filing Date': ret.filingDate || '',
      'Deadline': ret.deadline || '',
      'Notes': ret.notes || ''
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add summary sheet
    const summaryData = [
      ['Client History Report'],
      [''],
      ['Client Name:', history.clientName],
      ['CNIC/NTN:', history.cnicNtn],
      ['Total Returns:', history.totalReturns],
      ['Total Income:', history.totalIncome.toFixed(2)],
      ['Total Tax Paid:', history.totalTaxPaid.toFixed(2)],
      ['Total Refunds:', history.totalRefunds.toFixed(2)],
      [''],
      ['Return Details:']
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Add details sheet
    const detailsWs = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, detailsWs, 'Returns');

    // Generate and download file
    XLSX.writeFile(wb, filename || `client_history_${history.cnicNtn}.xlsx`);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting client history:', error);
    throw error;
  }
}
