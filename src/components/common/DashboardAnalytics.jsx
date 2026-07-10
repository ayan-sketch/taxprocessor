import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardAnalytics({ returns = [] }) {
  // Return Type Distribution
  const returnTypeDistribution = useMemo(() => {
    const typeCounts = {};
    (returns || []).forEach(ret => {
      const type = ret.return_type || ret.returnType || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);

    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{
        label: 'Number of Returns',
        data: data.length > 0 ? data : [0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)'
        ],
        borderWidth: 2
      }]
    };
  }, [returns]);

  // Filing Trends by Month
  const filingTrends = useMemo(() => {
    const monthlyData = {};
    const currentYear = new Date().getFullYear();

    (returns || []).forEach(ret => {
      const dateStr = ret.filing_date || ret.filingDate || ret.processed_date || ret.processedDate;
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        if (!monthlyData[month]) {
          monthlyData[month] = { count: 0, filed: 0, processed: 0, pending: 0 };
        }
        monthlyData[month].count++;
        
        const status = ret.status || 'Pending';
        if (status === 'Filed') monthlyData[month].filed++;
        else if (status === 'Processed') monthlyData[month].processed++;
        else monthlyData[month].pending++;
      }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const countData = months.map((_, i) => monthlyData[i]?.count || 0);
    const filedData = months.map((_, i) => monthlyData[i]?.filed || 0);
    const processedData = months.map((_, i) => monthlyData[i]?.processed || 0);

    return {
      labels: months,
      datasets: [
        {
          label: 'Total Returns',
          data: countData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Filed',
          data: filedData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Processed',
          data: processedData,
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [returns]);

  // Status Distribution
  const statusDistribution = useMemo(() => {
    const statusCounts = {};
    (returns || []).forEach(ret => {
      const status = ret.status || 'Pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          'rgb(245, 158, 11)',
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)'
        ],
        borderWidth: 2
      }]
    };
  }, [returns]);

  // Year-over-Year Comparison
  const yearOverYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    const yearlyData = {};

    years.forEach(year => {
      yearlyData[year] = { count: 0, filed: 0, processed: 0, pending: 0 };
    });

    (returns || []).forEach(ret => {
      const year = parseInt(ret.tax_year || ret.taxYear);
      if (yearlyData[year]) {
        yearlyData[year].count++;
        const status = ret.status || 'Pending';
        if (status === 'Filed') yearlyData[year].filed++;
        else if (status === 'Processed') yearlyData[year].processed++;
        else yearlyData[year].pending++;
      }
    });

    return {
      labels: years.map(y => y.toString()),
      datasets: [
        {
          label: 'Total Returns',
          data: years.map(y => yearlyData[y].count),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        },
        {
          label: 'Filed',
          data: years.map(y => yearlyData[y].filed),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2
        },
        {
          label: 'Processed',
          data: years.map(y => yearlyData[y].processed),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 2
        }
      ]
    };
  }, [returns]);

  // Client Portfolio Overview Stats
  const portfolioStats = useMemo(() => {
    const safeReturns = returns || [];
    const uniqueClients = new Set(safeReturns.map(r => r.cnic_ntn || r.cnicNtn || r.cnic || r.ntn)).size;
    const totalReturns = safeReturns.length;
    
    // Count by status
    const filedCount = safeReturns.filter(r => r.status === 'Filed').length;
    const processedCount = safeReturns.filter(r => r.status === 'Processed').length;
    const pendingCount = safeReturns.filter(r => r.status === 'Pending').length;
    const rejectedCount = safeReturns.filter(r => r.status === 'Rejected').length;
    
    // Count by year
    const currentYear = new Date().getFullYear();
    const currentYearReturns = safeReturns.filter(r => parseInt(r.tax_year || r.taxYear) === currentYear).length;
    
    // Count by return type
    const voluntaryReturns = safeReturns.filter(r => (r.return_type || r.returnType || '').includes('114(1)')).length;
    const noticeReturns = safeReturns.filter(r => (r.return_type || r.returnType || '').includes('114(4)')).length;
    const amendedReturns = safeReturns.filter(r => (r.return_type || r.returnType || '').includes('120')).length;

    return {
      uniqueClients,
      totalReturns,
      filedCount,
      processedCount,
      pendingCount,
      rejectedCount,
      currentYearReturns,
      voluntaryReturns,
      noticeReturns,
      amendedReturns,
      completionRate: totalReturns > 0 ? ((filedCount + processedCount) / totalReturns * 100) : 0
    };
  }, [returns]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Clients</p>
              <p className="text-3xl font-bold mt-2">{portfolioStats.uniqueClients}</p>
            </div>
            <svg className="w-12 h-12 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Returns</p>
              <p className="text-3xl font-bold mt-2">{portfolioStats.totalReturns}</p>
            </div>
            <svg className="w-12 h-12 text-green-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Filed Returns</p>
              <p className="text-3xl font-bold mt-2">{portfolioStats.filedCount}</p>
            </div>
            <svg className="w-12 h-12 text-orange-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Completion Rate</p>
              <p className="text-3xl font-bold mt-2">{(portfolioStats.completionRate || 0).toFixed(1)}%</p>
            </div>
            <svg className="w-12 h-12 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Return Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Return Type Distribution</h3>
          <div className="h-80">
            <Bar data={returnTypeDistribution} options={chartOptions} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Status Distribution</h3>
          <div className="h-80">
            <Doughnut data={statusDistribution} options={chartOptions} />
          </div>
        </div>

        {/* Filing Trends */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Filing Trends (Current Year)</h3>
          <div className="h-80">
            <Line data={filingTrends} options={chartOptions} />
          </div>
        </div>

        {/* Year-over-Year Comparison */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Year-over-Year Comparison</h3>
          <div className="h-80">
            <Bar data={yearOverYear} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 font-medium">Current Year Returns</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{portfolioStats.currentYearReturns}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <p className="text-sm text-gray-600 font-medium">Voluntary Returns (114(1))</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{portfolioStats.voluntaryReturns}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 font-medium">Pending Returns</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{portfolioStats.pendingCount}</p>
        </div>
      </div>
    </div>
  );
}
