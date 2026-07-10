import React, { useState, useMemo } from 'react';
import { 
  exportToExcel, 
  exportToCSV, 
  generateMonthlySummary, 
  generateYearlySummary,
  generateClientHistory,
  exportClientHistory
} from '../../utils/exportHelpers';

export default function ReportsModal({ isOpen, onClose, returns = [] }) {
  const [reportType, setReportType] = useState('export');
  const [exportFormat, setExportFormat] = useState('excel');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClient, setSelectedClient] = useState('');
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [yearlySummary, setYearlySummary] = useState(null);
  const [clientHistory, setClientHistory] = useState(null);

  // Get unique clients
  const uniqueClients = useMemo(() => {
    const clients = (returns || [])
      .filter(ret => (ret.cnic_ntn || ret.cnicNtn || ret.cnic) && (ret.client_name || ret.name))
      .map(ret => ({ cnicNtn: ret.cnic_ntn || ret.cnicNtn || ret.cnic, name: ret.client_name || ret.name }));
    
    const unique = [];
    const seen = new Set();
    
    clients.forEach(client => {
      if (!seen.has(client.cnicNtn)) {
        seen.add(client.cnicNtn);
        unique.push(client);
      }
    });
    
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  }, [returns]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set();
    (returns || []).forEach(ret => {
      const date = new Date(ret.processed_date || ret.processedDate || ret.filing_date || ret.filingDate);
      if (!isNaN(date.getTime())) {
        years.add(date.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [returns]);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const filename = `tax_returns_${new Date().toISOString().split('T')[0]}`;
      
      if (exportFormat === 'excel') {
        exportToExcel(returns, `${filename}.xlsx`);
      } else {
        exportToCSV(returns, `${filename}.csv`);
      }
      
      alert(`Successfully exported ${returns.length} returns to ${exportFormat.toUpperCase()}`);
    } catch (error) {
      alert('Error exporting data: ' + error.message);
    }
  };

  const handleGenerateMonthlySummary = () => {
    const summary = generateMonthlySummary(returns, selectedMonth, selectedYear);
    setMonthlySummary(summary);
  };

  const handleGenerateYearlySummary = () => {
    const summary = generateYearlySummary(returns, selectedYear);
    setYearlySummary(summary);
  };

  const handleGenerateClientHistory = () => {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }
    const history = generateClientHistory(returns, selectedClient);
    setClientHistory(history);
  };

  const handleExportClientHistory = () => {
    if (!clientHistory) return;
    try {
      exportClientHistory(clientHistory);
      alert('Client history exported successfully');
    } catch (error) {
      alert('Error exporting client history: ' + error.message);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Reports & Export</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Report Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setReportType('export')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  reportType === 'export'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Batch Export
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  reportType === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Monthly Summary
              </button>
              <button
                onClick={() => setReportType('yearly')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  reportType === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Yearly Summary
              </button>
              <button
                onClick={() => setReportType('client')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  reportType === 'client'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Client History
              </button>
            </div>
          </div>

          {/* Batch Export */}
          {reportType === 'export' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Total Returns:</strong> {returns.length}
                </p>
                <p className="text-sm text-gray-600">
                  Export will include: Name, CNIC/NTN, Tax Year, Status, Income, Tax Paid, 
                  Refund, Filing Date, Deadline, Contact Info, and Notes
                </p>
              </div>
              <button
                onClick={handleExport}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Export {returns.length} Returns
              </button>
            </div>
          )}

          {/* Monthly Summary */}
          {reportType === 'monthly' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerateMonthlySummary}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Generate Monthly Summary
              </button>

              {monthlySummary && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-bold text-lg">
                    {monthNames[monthlySummary.month - 1]} {monthlySummary.year} Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Total Returns</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {monthlySummary.totalReturns}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Average Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        {monthlySummary.averageIncome.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Total Tax Paid</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {monthlySummary.totalTaxPaid.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Total Refunds</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {monthlySummary.totalRefunds.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-2">Status Breakdown</p>
                    {Object.entries(monthlySummary.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex justify-between text-sm">
                        <span className="text-gray-600">{status}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Yearly Summary */}
          {reportType === 'yearly' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGenerateYearlySummary}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Generate Yearly Summary
              </button>

              {yearlySummary && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-bold text-lg">{yearlySummary.year} Annual Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Total Returns</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {yearlySummary.totalReturns}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Average Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        {yearlySummary.averageIncome.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Total Tax Paid</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {yearlySummary.totalTaxPaid.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Total Refunds</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {yearlySummary.totalRefunds.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-2">Monthly Distribution</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {Object.entries(yearlySummary.monthlyBreakdown).map(([month, count]) => (
                        <div key={month} className="flex justify-between">
                          <span className="text-gray-600">{monthNames[month - 1].slice(0, 3)}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-2">Status Breakdown</p>
                    {Object.entries(yearlySummary.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex justify-between text-sm">
                        <span className="text-gray-600">{status}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Client History */}
          {reportType === 'client' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Client
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Client --</option>
                  {uniqueClients.map(client => (
                    <option key={client.cnicNtn} value={client.cnicNtn}>
                      {client.name} ({client.cnicNtn})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGenerateClientHistory}
                disabled={!selectedClient}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Generate Client History
              </button>

              {clientHistory && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{clientHistory.clientName}</h3>
                      <p className="text-sm text-gray-600">CNIC/NTN: {clientHistory.cnicNtn}</p>
                    </div>
                    <button
                      onClick={handleExportClientHistory}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                    >
                      Export to Excel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Total Returns</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {clientHistory.totalReturns}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Years Filed</p>
                      <p className="text-sm font-medium text-gray-700">
                        {clientHistory.years.join(', ')}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Total Income</p>
                      <p className="text-xl font-bold text-green-600">
                        {clientHistory.totalIncome.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Total Tax Paid</p>
                      <p className="text-xl font-bold text-orange-600">
                        {clientHistory.totalTaxPaid.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded max-h-60 overflow-y-auto">
                    <p className="text-sm font-medium text-gray-700 mb-2">Return History</p>
                    <div className="space-y-2">
                      {clientHistory.returns.map((ret, index) => (
                        <div key={index} className="border-b pb-2 last:border-b-0">
                          <div className="flex justify-between">
                            <span className="font-medium">Tax Year {ret.taxYear}</span>
                            <span className="text-sm text-gray-600">{ret.status || 'Pending'}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Income: {ret.incomeAmount || 'N/A'} | Tax: {ret.taxPaid || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
