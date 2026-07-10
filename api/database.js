const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.join(__dirname, '../tax_automation.db');

// Initialize database connection
let db = null;

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    // Create database file if it doesn't exist
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✓ Connected to SQLite database:', DB_PATH);
      
      // Create tables
      createTables()
        .then(() => {
          console.log('✓ Database tables initialized');
          return insertDefaultTaxSlabs();
        })
        .then(() => {
          console.log('✓ Default tax slabs inserted');
          resolve(db);
        })
        .catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable WAL mode for better concurrency and performance
      db.run(`PRAGMA journal_mode = WAL;`, (err) => {
        if (err) console.warn('Warning enabling WAL mode:', err);
        else console.log('✓ WAL mode enabled');
      });

      // Enable foreign keys enforcement
      db.run(`PRAGMA foreign_keys = ON;`, (err) => {
        if (err) console.warn('Warning enabling foreign_keys:', err);
        else console.log('✓ Foreign keys enabled');
      });

      // Create clients table
      db.run(`
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          cnic TEXT,
          ntn TEXT,
          dob TEXT,
          address TEXT,
          phone TEXT,
          email TEXT,
          metadata TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating clients table:', err);
          reject(err);
          return;
        }
        console.log('✓ clients table created/verified');
      });

      // Create returns table
      db.run(`
        CREATE TABLE IF NOT EXISTS returns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          tax_year TEXT NOT NULL,
          status TEXT DEFAULT 'draft',
          summary TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating returns table:', err);
          reject(err);
          return;
        }
        console.log('✓ returns table created/verified');
      });

      // Generic income tables
      db.run(`
        CREATE TABLE IF NOT EXISTS salary_income (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          code TEXT,
          total REAL DEFAULT 0,
          exempt REAL DEFAULT 0,
          normal REAL DEFAULT 0,
          metadata TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS business_income (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          description TEXT,
          total REAL DEFAULT 0,
          exempt REAL DEFAULT 0,
          normal REAL DEFAULT 0,
          metadata TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS property_income (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          code TEXT,
          receipts REAL DEFAULT 0,
          deductions REAL DEFAULT 0,
          net REAL DEFAULT 0,
          metadata TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS capital_gain (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          description TEXT,
          total REAL DEFAULT 0,
          metadata TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS foreign_income (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          code TEXT,
          total REAL DEFAULT 0,
          tax_paid REAL DEFAULT 0,
          metadata TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS other_sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          code TEXT,
          total REAL DEFAULT 0,
          exempt REAL DEFAULT 0,
          normal REAL DEFAULT 0,
          metadata TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
        )
      `);

      // Tax calculations cache
      db.run(`
        CREATE TABLE IF NOT EXISTS tax_calculations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          taxable_income REAL NOT NULL,
          tax_year TEXT NOT NULL,
          tax_slab_id INTEGER,
          tax_rate REAL,
          calculated_tax REAL NOT NULL,
          calculation_date TEXT DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
        )
      `);

      // Wealth statements
      db.run(`
        CREATE TABLE IF NOT EXISTS wealth_statements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          assets_json TEXT,
          liabilities_json TEXT,
          net_worth REAL DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
        )
      `);

      // Indexes for fast searching and lookup
      db.run(`CREATE INDEX IF NOT EXISTS idx_clients_cnic ON clients(cnic);`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_clients_ntn ON clients(ntn);`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_returns_client_id ON returns(client_id);`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_returns_tax_year ON returns(tax_year);`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_salary_return_id ON salary_income(return_id);`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_property_return_id ON property_income(return_id);`);

      // Create salary_tax_slabs table
      db.run(`
        CREATE TABLE IF NOT EXISTS salary_tax_slabs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tax_year TEXT NOT NULL,
          income_from REAL NOT NULL,
          income_to REAL,
          fixed_tax REAL NOT NULL DEFAULT 0,
          rate_percent REAL NOT NULL DEFAULT 0,
          tax_credit REAL NOT NULL DEFAULT 0,
          additional_tax REAL NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating salary_tax_slabs table:', err);
          reject(err);
          return;
        }
        console.log('✓ salary_tax_slabs table created/verified');
      });

      // Create index on tax_year for faster queries
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_tax_year ON salary_tax_slabs(tax_year, is_active)
      `, (err) => {
        if (err) {
          console.error('Error creating index:', err);
        }
      });

      // Create business_tax_slabs table
      db.run(`
        CREATE TABLE IF NOT EXISTS business_tax_slabs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tax_year TEXT NOT NULL,
          category TEXT NOT NULL,
          code TEXT,
          description TEXT,
          income_from REAL NOT NULL,
          income_to REAL,
          fixed_tax REAL NOT NULL DEFAULT 0,
          rate_percent REAL NOT NULL DEFAULT 0,
          min_tax REAL NOT NULL DEFAULT 0,
          additional_tax REAL NOT NULL DEFAULT 0,
          surcharge REAL NOT NULL DEFAULT 0,
          adjustable_tax REAL NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating business_tax_slabs table:', err);
          reject(err);
          return;
        }
        console.log('✓ business_tax_slabs table created/verified');
      });

      // Create index on tax_year and category for faster queries
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_business_tax_year_category ON business_tax_slabs(tax_year, category, is_active)
      `, (err) => {
        if (err) {
          console.error('Error creating index:', err);
        }
      });

      resolve();
    });
  });
};

const insertDefaultTaxSlabs = () => {
  return new Promise((resolve, reject) => {
    // Check if default slabs already exist for 2026
    db.get('SELECT COUNT(*) as count FROM salary_tax_slabs WHERE tax_year = ?', ['2026'], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count > 0) {
        console.log('✓ Default tax slabs already exist for 2026');
        insertDefaultBusinessTaxSlabs().then(resolve).catch(reject);
        return;
      }

      // Insert default 2026 tax slabs
      const defaultSlabs = [
        { tax_year: '2026', income_from: 0, income_to: 600000, fixed_tax: 0, rate_percent: 0 },
        { tax_year: '2026', income_from: 600001, income_to: 1200000, fixed_tax: 0, rate_percent: 1 },
        { tax_year: '2026', income_from: 1200001, income_to: 2200000, fixed_tax: 6000, rate_percent: 11 },
        { tax_year: '2026', income_from: 2200001, income_to: 3200000, fixed_tax: 116000, rate_percent: 23 },
        { tax_year: '2026', income_from: 3200001, income_to: 4100000, fixed_tax: 346000, rate_percent: 30 },
        { tax_year: '2026', income_from: 4100001, income_to: null, fixed_tax: 616000, rate_percent: 35 }
      ];

      const stmt = db.prepare(`
        INSERT INTO salary_tax_slabs (tax_year, income_from, income_to, fixed_tax, rate_percent, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `);

      let completed = 0;
      defaultSlabs.forEach((slab, index) => {
        stmt.run([slab.tax_year, slab.income_from, slab.income_to, slab.fixed_tax, slab.rate_percent], (err) => {
          if (err) {
            console.error(`Error inserting slab ${index + 1}:`, err);
          }
          completed++;
          if (completed === defaultSlabs.length) {
            stmt.finalize();
            console.log(`✓ Inserted ${defaultSlabs.length} default tax slabs for 2026`);
            insertDefaultBusinessTaxSlabs().then(resolve).catch(reject);
          }
        });
      });
    });
  });
};

const insertDefaultBusinessTaxSlabs = () => {
  return new Promise((resolve, reject) => {
    // Check if default business slabs already exist for 2026
    db.get('SELECT COUNT(*) as count FROM business_tax_slabs WHERE tax_year = ?', ['2026'], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count > 0) {
        console.log('✓ Default business tax slabs already exist for 2026');
        resolve();
        return;
      }

      // Business categories
      const categories = [
        'Individual Business',
        'Partnership Firm',
        'AOP',
        'Retailer',
        'Wholesaler',
        'Service Provider',
        'CNG Station',
        'Petrol Pump',
        'Small Business',
        'Company'
      ];

      // Default slabs for each category (simplified for demo)
      const defaultSlabsByCategory = {
        'Individual Business': [
          { income_from: 0, income_to: 500000, fixed_tax: 0, rate_percent: 0, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 500001, income_to: 1000000, fixed_tax: 0, rate_percent: 5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 1000001, income_to: 2000000, fixed_tax: 25000, rate_percent: 10, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 2000001, income_to: null, fixed_tax: 125000, rate_percent: 15, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 }
        ],
        'Partnership Firm': [
          { income_from: 0, income_to: 500000, fixed_tax: 0, rate_percent: 0, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 500001, income_to: 1000000, fixed_tax: 0, rate_percent: 7.5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 1000001, income_to: 2000000, fixed_tax: 37500, rate_percent: 12.5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 2000001, income_to: null, fixed_tax: 162500, rate_percent: 17.5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 }
        ],
        'AOP': [
          { income_from: 0, income_to: 500000, fixed_tax: 0, rate_percent: 0, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 500001, income_to: 1000000, fixed_tax: 0, rate_percent: 7.5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 1000001, income_to: 2000000, fixed_tax: 37500, rate_percent: 12.5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 2000001, income_to: null, fixed_tax: 162500, rate_percent: 17.5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 }
        ],
        'Retailer': [
          { income_from: 0, income_to: 500000, fixed_tax: 0, rate_percent: 0, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 500001, income_to: 1000000, fixed_tax: 0, rate_percent: 2.5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 1000001, income_to: 2000000, fixed_tax: 12500, rate_percent: 5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 2000001, income_to: null, fixed_tax: 62500, rate_percent: 7.5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 }
        ],
        'Wholesaler': [
          { income_from: 0, income_to: 500000, fixed_tax: 0, rate_percent: 0, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 500001, income_to: 1000000, fixed_tax: 0, rate_percent: 3, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 1000001, income_to: 2000000, fixed_tax: 15000, rate_percent: 6, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 2000001, income_to: null, fixed_tax: 75000, rate_percent: 9, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 }
        ],
        'Service Provider': [
          { income_from: 0, income_to: 500000, fixed_tax: 0, rate_percent: 0, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 500001, income_to: 1000000, fixed_tax: 0, rate_percent: 5, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 1000001, income_to: 2000000, fixed_tax: 25000, rate_percent: 10, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 2000001, income_to: null, fixed_tax: 125000, rate_percent: 15, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 }
        ],
        'CNG Station': [
          { income_from: 0, income_to: 1000000, fixed_tax: 0, rate_percent: 0, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 1000001, income_to: 2000000, fixed_tax: 0, rate_percent: 4, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 2000001, income_to: 5000000, fixed_tax: 40000, rate_percent: 8, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 5000001, income_to: null, fixed_tax: 280000, rate_percent: 12, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 }
        ],
        'Petrol Pump': [
          { income_from: 0, income_to: 1000000, fixed_tax: 0, rate_percent: 0, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 1000001, income_to: 2000000, fixed_tax: 0, rate_percent: 3, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 2000001, income_to: 5000000, fixed_tax: 30000, rate_percent: 6, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 5000001, income_to: null, fixed_tax: 210000, rate_percent: 9, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 }
        ],
        'Small Business': [
          { income_from: 0, income_to: 400000, fixed_tax: 0, rate_percent: 0, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 400001, income_to: 800000, fixed_tax: 0, rate_percent: 4, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 800001, income_to: 1500000, fixed_tax: 16000, rate_percent: 8, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 1500001, income_to: null, fixed_tax: 72000, rate_percent: 12, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 }
        ],
        'Company': [
          { income_from: 0, income_to: 1000000, fixed_tax: 0, rate_percent: 0, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 1000001, income_to: 2000000, fixed_tax: 0, rate_percent: 15, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 2000001, income_to: 5000000, fixed_tax: 150000, rate_percent: 20, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 },
          { income_from: 5000001, income_to: null, fixed_tax: 750000, rate_percent: 29, min_tax: 0, additional_tax: 0, surcharge: 0, adjustable_tax: 0 }
        ]
      };

      const stmt = db.prepare(`
        INSERT INTO business_tax_slabs (tax_year, category, income_from, income_to, fixed_tax, rate_percent, min_tax, additional_tax, surcharge, adjustable_tax, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);

      let totalCompleted = 0;
      const totalSlabs = Object.values(defaultSlabsByCategory).reduce((sum, arr) => sum + arr.length, 0);

      categories.forEach((category) => {
        const slabs = defaultSlabsByCategory[category];
        slabs.forEach((slab, index) => {
          stmt.run([
            '2026',
            category,
            slab.income_from,
            slab.income_to,
            slab.fixed_tax,
            slab.rate_percent,
            slab.min_tax,
            slab.additional_tax,
            slab.surcharge,
            slab.adjustable_tax
          ], (err) => {
            if (err) {
              console.error(`Error inserting business slab for ${category} ${index + 1}:`, err);
            }
            totalCompleted++;
            if (totalCompleted === totalSlabs) {
              stmt.finalize();
              console.log(`✓ Inserted ${totalSlabs} default business tax slabs for 2026 across ${categories.length} categories`);
              resolve();
            }
          });
        });
      });
    });
  });
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✓ Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  DB_PATH
};
