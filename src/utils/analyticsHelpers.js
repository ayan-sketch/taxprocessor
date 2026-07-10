// Analytics Helper Functions for Client Management

/**
 * Calculate client health score based on multiple factors
 * @param {Object} client - Client object
 * @returns {Object} - Health score and rating
 */
export const calculateClientHealth = (client) => {
  let score = 0;
  let factors = [];

  // Factor 1: Last Contact (40 points max)
  const daysSinceContact = Math.floor(
    (new Date() - new Date(client.lastContact)) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceContact <= 7) {
    score += 40;
    factors.push({ name: 'Recent Contact', points: 40, status: 'excellent' });
  } else if (daysSinceContact <= 30) {
    score += 30;
    factors.push({ name: 'Recent Contact', points: 30, status: 'good' });
  } else if (daysSinceContact <= 60) {
    score += 15;
    factors.push({ name: 'Contact Needed', points: 15, status: 'warning' });
  } else {
    score += 5;
    factors.push({ name: 'Urgent Contact', points: 5, status: 'critical' });
  }

  // Factor 2: Status (20 points max)
  if (client.status === 'Active') {
    score += 20;
    factors.push({ name: 'Active Status', points: 20, status: 'excellent' });
  } else if (client.status === 'Pending') {
    score += 10;
    factors.push({ name: 'Pending Status', points: 10, status: 'warning' });
  } else {
    score += 0;
    factors.push({ name: 'Inactive Status', points: 0, status: 'critical' });
  }

  // Factor 3: Returns Filed (20 points max)
  const returns = client.returns || 0;
  if (returns >= 5) {
    score += 20;
    factors.push({ name: 'High Activity', points: 20, status: 'excellent' });
  } else if (returns >= 2) {
    score += 15;
    factors.push({ name: 'Moderate Activity', points: 15, status: 'good' });
  } else if (returns >= 1) {
    score += 10;
    factors.push({ name: 'Low Activity', points: 10, status: 'warning' });
  } else {
    score += 0;
    factors.push({ name: 'No Activity', points: 0, status: 'critical' });
  }

  // Factor 4: Revenue (20 points max)
  const revenue = parseFloat(client.totalRevenue?.replace(/[$,]/g, '') || 0);
  if (revenue >= 10000) {
    score += 20;
    factors.push({ name: 'High Value', points: 20, status: 'excellent' });
  } else if (revenue >= 5000) {
    score += 15;
    factors.push({ name: 'Good Value', points: 15, status: 'good' });
  } else if (revenue >= 1000) {
    score += 10;
    factors.push({ name: 'Moderate Value', points: 10, status: 'warning' });
  } else {
    score += 5;
    factors.push({ name: 'Low Value', points: 5, status: 'critical' });
  }

  // Determine rating
  let rating, color, label;
  if (score >= 80) {
    rating = 'Excellent';
    color = 'green';
    label = 'Healthy';
  } else if (score >= 60) {
    rating = 'Good';
    color = 'blue';
    label = 'Stable';
  } else if (score >= 40) {
    rating = 'Fair';
    color = 'yellow';
    label = 'Needs Attention';
  } else {
    rating = 'Poor';
    color = 'red';
    label = 'At Risk';
  }

  return {
    score,
    rating,
    color,
    label,
    factors
  };
};

/**
 * Calculate analytics metrics from client data
 * @param {Array} clients - Array of client objects
 * @returns {Object} - Analytics metrics
 */
export const calculateAnalytics = (clients) => {
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'Active').length;
  const inactiveClients = clients.filter(c => c.status === 'Inactive').length;
  const pendingClients = clients.filter(c => c.status === 'Pending').length;

  // Revenue calculations
  const totalRevenue = clients.reduce((sum, c) => {
    return sum + parseFloat(c.totalRevenue?.replace(/[$,]/g, '') || 0);
  }, 0);

  const avgRevenue = totalClients > 0 ? totalRevenue / totalClients : 0;

  // Returns calculations
  const totalReturns = clients.reduce((sum, c) => sum + (c.returns || 0), 0);
  const avgReturns = totalClients > 0 ? totalReturns / totalClients : 0;

  // Client health distribution
  const healthScores = clients.map(c => calculateClientHealth(c));
  const excellentHealth = healthScores.filter(h => h.score >= 80).length;
  const goodHealth = healthScores.filter(h => h.score >= 60 && h.score < 80).length;
  const fairHealth = healthScores.filter(h => h.score >= 40 && h.score < 60).length;
  const poorHealth = healthScores.filter(h => h.score < 40).length;

  // Business type distribution
  const businessTypes = clients.reduce((acc, c) => {
    acc[c.businessType] = (acc[c.businessType] || 0) + 1;
    return acc;
  }, {});

  // Top clients by revenue
  const topClients = [...clients]
    .sort((a, b) => {
      const aRev = parseFloat(a.totalRevenue?.replace(/[$,]/g, '') || 0);
      const bRev = parseFloat(b.totalRevenue?.replace(/[$,]/g, '') || 0);
      return bRev - aRev;
    })
    .slice(0, 10);

  // Clients needing attention (last contact > 30 days)
  const needsAttention = clients.filter(c => {
    const daysSinceContact = Math.floor(
      (new Date() - new Date(c.lastContact)) / (1000 * 60 * 60 * 24)
    );
    return daysSinceContact > 30 && c.status === 'Active';
  }).length;

  // Calculate retention rate (simplified - assumes all active clients are retained)
  const retentionRate = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;

  // Calculate churn rate
  const churnRate = totalClients > 0 ? (inactiveClients / totalClients) * 100 : 0;

  return {
    totalClients,
    activeClients,
    inactiveClients,
    pendingClients,
    totalRevenue,
    avgRevenue,
    totalReturns,
    avgReturns,
    healthDistribution: {
      excellent: excellentHealth,
      good: goodHealth,
      fair: fairHealth,
      poor: poorHealth
    },
    businessTypes,
    topClients,
    needsAttention,
    retentionRate,
    churnRate
  };
};

/**
 * Generate revenue trend data for charts
 * @param {Array} clients - Array of client objects
 * @returns {Array} - Monthly revenue data
 */
export const generateRevenueTrend = (clients) => {
  // Simulate monthly data (in real app, this would come from transaction history)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, index) => {
    // Simulate revenue growth
    const baseRevenue = clients.reduce((sum, c) => {
      return sum + parseFloat(c.totalRevenue?.replace(/[$,]/g, '') || 0);
    }, 0);
    
    const monthlyRevenue = (baseRevenue / (currentMonth + 1)) * (0.7 + Math.random() * 0.6);
    
    return {
      month,
      revenue: Math.round(monthlyRevenue),
      clients: Math.round(clients.length * (0.6 + (index / months.length) * 0.4))
    };
  });
};

/**
 * Generate client acquisition data
 * @param {Array} clients - Array of client objects
 * @returns {Array} - Monthly acquisition data
 */
export const generateAcquisitionData = (clients) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, index) => {
    // Simulate new clients per month
    const newClients = Math.floor(clients.length * (0.1 + Math.random() * 0.15));
    
    return {
      month,
      newClients,
      cumulative: Math.round(clients.length * ((index + 1) / (currentMonth + 1)))
    };
  });
};

/**
 * Calculate client lifetime value
 * @param {Object} client - Client object
 * @returns {number} - Estimated CLV
 */
export const calculateCLV = (client) => {
  const revenue = parseFloat(client.totalRevenue?.replace(/[$,]/g, '') || 0);
  const returns = client.returns || 0;
  
  // Simple CLV calculation: (Average Revenue per Return) * (Expected Lifetime Returns)
  const avgRevenuePerReturn = returns > 0 ? revenue / returns : revenue;
  const expectedLifetimeReturns = 10; // Assume 10 years of returns
  
  return Math.round(avgRevenuePerReturn * expectedLifetimeReturns);
};

/**
 * Get risk level for a client
 * @param {Object} client - Client object
 * @returns {Object} - Risk assessment
 */
export const assessClientRisk = (client) => {
  const health = calculateClientHealth(client);
  const daysSinceContact = Math.floor(
    (new Date() - new Date(client.lastContact)) / (1000 * 60 * 60 * 24)
  );
  
  let riskLevel, riskColor, riskFactors = [];
  
  if (health.score < 40) {
    riskLevel = 'High';
    riskColor = 'red';
    riskFactors.push('Low health score');
  } else if (health.score < 60) {
    riskLevel = 'Medium';
    riskColor = 'yellow';
  } else {
    riskLevel = 'Low';
    riskColor = 'green';
  }
  
  if (daysSinceContact > 60) {
    riskFactors.push('No recent contact');
    if (riskLevel === 'Low') riskLevel = 'Medium';
  }
  
  if (client.status === 'Inactive') {
    riskFactors.push('Inactive status');
    riskLevel = 'High';
    riskColor = 'red';
  }
  
  if (client.returns === 0) {
    riskFactors.push('No returns filed');
  }
  
  return {
    level: riskLevel,
    color: riskColor,
    factors: riskFactors,
    score: health.score
  };
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format percentage for display
 * @param {number} value - Value to format
 * @returns {string} - Formatted percentage
 */
export const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};

/**
 * Get trend indicator
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {Object} - Trend information
 */
export const getTrend = (current, previous) => {
  if (previous === 0) return { direction: 'neutral', percentage: 0, color: 'gray' };
  
  const change = ((current - previous) / previous) * 100;
  
  return {
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    percentage: Math.abs(change),
    color: change > 0 ? 'green' : change < 0 ? 'red' : 'gray',
    value: change
  };
};
