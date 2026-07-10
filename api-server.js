const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeDatabase } = require('./api/database');

const salaryTaxRoutes = require('./api/salaryTaxRoutes');
const businessTaxRoutes = require('./api/businessTaxRoutes');
const returnsRoutes = require('./api/returnsRoutes');
const noticeRoutes = require('./api/noticeRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

// Initialize DB then mount routes
(async () => {
  try {
    await initializeDatabase();

    // Mount API routers
    app.use('/api/salary-tax', salaryTaxRoutes);
    app.use('/api/business-tax', businessTaxRoutes);
    app.use('/api', returnsRoutes);
    app.use('/api/notices', noticeRoutes);

    const PORT = 3000;
    app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start API server:', err);
    process.exit(1);
  }
})();
