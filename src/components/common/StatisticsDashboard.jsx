/**
 * Statistics Dashboard Component
 * Displays analytics and metrics for tax returns
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';

const StatisticsDashboard = ({ returns }) => {
  const [stats, setStats] = useState({
    totalReturns: 0,
    totalRefunds: 0,
    totalIncome: 0,
    totalTaxPaid: 0,
    avgProcessingTime: 0,
    successRate: 0,
    byYear: {},
    byStatus: {},
    recentReturns: []
  });

  useEffect(() => {
    if (returns && returns.length > 0) {
      calculateStats(returns);
    }
  }, [returns]);

  const calculateStats = (data) => {
    const totalReturns = data.length;
    
    // Calculate totals
    let totalRefunds = 0;
    let totalIncome = 0;
    let totalTaxPaid = 0;
    let refundCount = 0;
    
    const byYear = {};
    const byStatus = {};
    
    data.forEach(ret => {
      // Refunds
      const refund = parseFloat(ret.refund_amount) || 0;
      if (refund > 0) {
        totalRefunds += refund;
        refundCount++;
      }
      
      // Income
      const income = parseFloat(ret.total_income) || 0;
      totalIncome += income;
      
      // Tax Paid
      const taxPaid = parseFloat(ret.tax_paid) || 0;
      totalTaxPaid += taxPaid;
      
      // By Year
      const year = ret.tax_year || 'Unknown';
      byYear[year] = (byYear[year] || 0) + 1;
      
      // By Status
      const status = ret.status || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    
    // Calculate success rate (returns with complete data)
    const completeReturns = data.filter(ret => 
      ret.client_name && 
      ret.client_name !== 'Unknown' &&
      (ret.cnic || ret.ntn) &&
      ret.tax_year && 
      ret.tax_year !== 'Unknown'
    ).length;
    
    const successRate = totalReturns > 0 ? (completeReturns / totalReturns * 100).toFixed(1) : 0;
    
    // Get recent returns (last 5)
    const recentReturns = [...data]
      .sort((a, b) => new Date(b.processed_at) - new Date(a.processed_at))
      .slice(0, 5);
    
    setStats({
      totalReturns,
      totalRefunds,
      totalIncome,
      totalTaxPaid,
      refundCount,
      avgProcessingTime: 0, // Would need timestamp data
      successRate,
      byYear,
      byStatus,
      recentReturns
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Returns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600/30 rounded-xl">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.totalReturns}</h3>
          <p className="text-sm text-gray-400">Total Returns Processed</p>
        </motion.div>

        {/* Total Refunds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs text-green-400 font-medium">{stats.refundCount} returns</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(stats.totalRefunds)}</h3>
          <p className="text-sm text-gray-400">Total Refunds</p>
        </motion.div>

        {/* Total Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(stats.totalIncome)}</h3>
          <p className="text-sm text-gray-400">Total Income Declared</p>
        </motion.div>

        {/* Success Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600/30 rounded-xl">
              <CheckCircle className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.successRate}%</h3>
          <p className="text-sm text-gray-400">Data Extraction Success</p>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Tax Year */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 bg-black/20 border border-white/10 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Returns by Tax Year</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.byYear)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([year, count]) => (
                <div key={year} className="flex items-center justify-between">
                  <span className="text-gray-300">{year}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${(count / stats.totalReturns) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-semibold w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* By Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-black/20 border border-white/10 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Returns by Status</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const colors = {
                'Processed': 'from-blue-500 to-blue-600',
                'Filed': 'from-green-500 to-green-600',
                'Under Review': 'from-yellow-500 to-yellow-600',
                'Approved': 'from-emerald-500 to-emerald-600',
                'Rejected': 'from-red-500 to-red-600'
              };
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-gray-300">{status}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[status] || 'from-gray-500 to-gray-600'} rounded-full`}
                        style={{ width: `${(count / stats.totalReturns) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-semibold w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 bg-black/20 border border-white/10 rounded-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Recent Returns</h3>
        </div>
        <div className="space-y-2">
          {stats.recentReturns.map((ret, index) => (
            <div
              key={ret.id}
              className="flex items-center justify-between p-3 bg-black/30 rounded-xl hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">{ret.client_name}</p>
                  <p className="text-xs text-gray-400">Tax Year: {ret.tax_year}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {new Date(ret.processed_at).toLocaleDateString()}
                </p>
                {ret.refund_amount && parseFloat(ret.refund_amount) > 0 && (
                  <p className="text-xs text-green-400">
                    Refund: {formatCurrency(parseFloat(ret.refund_amount))}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default StatisticsDashboard;
