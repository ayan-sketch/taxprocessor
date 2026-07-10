const express = require('express');
const router = express.Router();
const { getDatabase } = require('./database');

// Helper: run multiple statements inside a transaction
const runTransaction = (db, statements) => {
  return new Promise((resolve, reject) => {
    db.exec('BEGIN TRANSACTION;', (err) => {
      if (err) return reject(err);

      let i = 0;
      const runNext = () => {
        if (i >= statements.length) {
          db.exec('COMMIT;', (err) => {
            if (err) return reject(err);
            resolve();
          });
          return;
        }

        const { sql, params } = statements[i++];
        db.run(sql, params || [], (err) => {
          if (err) {
            db.exec('ROLLBACK;', () => {
              return reject(err);
            });
            return;
          }
          runNext();
        });
      };

      runNext();
    });
  });
};

// Create a new return (client + return + incomes + tax calculation + wealth)
router.post('/returns', async (req, res) => {
  const db = getDatabase();
  const payload = req.body || {};
  const client = payload.client || {};
  const taxReturn = payload.return || {};
  const incomes = payload.incomes || {};
  const taxCalculation = payload.taxCalculation || null;
  const wealth = payload.wealth || null;

  try {
    // Upsert client by CNIC or NTN if provided
    const clientParams = [client.name || null, client.cnic || null, client.ntn || null, client.dob || null, client.address || null, client.phone || null, client.email || null, JSON.stringify(client.metadata || {})];

    // We'll attempt to find existing client by CNIC or NTN
    const findClientSql = client.cnic ? 'SELECT id FROM clients WHERE cnic = ?' : (client.ntn ? 'SELECT id FROM clients WHERE ntn = ?' : null);

    let clientId = null;

    if (findClientSql) {
      const row = await new Promise((resolve, reject) => db.get(findClientSql, [client.cnic || client.ntn], (err, r) => err ? reject(err) : resolve(r)));
      if (row && row.id) clientId = row.id;
    }

    const statements = [];

    if (!clientId) {
      // Insert new client
      statements.push({
        sql: `INSERT INTO clients (name, cnic, ntn, dob, address, phone, email, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        params: clientParams
      });
    } else {
      // Update existing client
      statements.push({
        sql: `UPDATE clients SET name = ?, cnic = ?, ntn = ?, dob = ?, address = ?, phone = ?, email = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
        params: [...clientParams, clientId]
      });
    }

    // Insert return (we'll use a placeholder for client_id which we fix after transaction)
    statements.push({
      sql: `INSERT INTO returns (client_id, tax_year, status, summary) VALUES (?, ?, ?, ?);`,
      params: [clientId || -1, taxReturn.tax_year || '', taxReturn.status || 'draft', JSON.stringify(taxReturn.summary || {})]
    });

    // Execute statements in transaction
    await runTransaction(db, statements);

    // Retrieve client id if new
    if (!clientId) {
      const lastClient = await new Promise((resolve, reject) => db.get('SELECT id FROM clients ORDER BY id DESC LIMIT 1', [], (err, r) => err ? reject(err) : resolve(r)));
      clientId = lastClient.id;
    }

    // Retrieve last inserted return id
    const lastReturn = await new Promise((resolve, reject) => db.get('SELECT id FROM returns ORDER BY id DESC LIMIT 1', [], (err, r) => err ? reject(err) : resolve(r)));
    const returnId = lastReturn.id;

    // Now insert incomes (multiple tables). Use a transaction for bulk inserts.
    const incomeStatements = [];

    if (incomes.salary && Array.isArray(incomes.salary)) {
      incomes.salary.forEach(s => {
        incomeStatements.push({ sql: `INSERT INTO salary_income (return_id, code, total, exempt, normal, metadata) VALUES (?, ?, ?, ?, ?, ?);`, params: [returnId, s.code || null, s.total || 0, s.exempt || 0, s.normal || 0, JSON.stringify(s.metadata || {})] });
      });
    }

    if (incomes.business && Array.isArray(incomes.business)) {
      incomes.business.forEach(b => {
        incomeStatements.push({ sql: `INSERT INTO business_income (return_id, description, total, exempt, normal, metadata) VALUES (?, ?, ?, ?, ?, ?);`, params: [returnId, b.description || null, b.total || 0, b.exempt || 0, b.normal || 0, JSON.stringify(b.metadata || {})] });
      });
    }

    if (incomes.property && Array.isArray(incomes.property)) {
      incomes.property.forEach(p => {
        incomeStatements.push({ sql: `INSERT INTO property_income (return_id, code, receipts, deductions, net, metadata) VALUES (?, ?, ?, ?, ?, ?);`, params: [returnId, p.code || null, p.receipts || 0, p.deductions || 0, p.net || 0, JSON.stringify(p.metadata || {})] });
      });
    }

    if (incomes.capital && Array.isArray(incomes.capital)) {
      incomes.capital.forEach(cg => {
        incomeStatements.push({ sql: `INSERT INTO capital_gain (return_id, description, total, metadata) VALUES (?, ?, ?, ?);`, params: [returnId, cg.description || null, cg.total || 0, JSON.stringify(cg.metadata || {})] });
      });
    }

    if (incomes.foreign && Array.isArray(incomes.foreign)) {
      incomes.foreign.forEach(fi => {
        incomeStatements.push({ sql: `INSERT INTO foreign_income (return_id, code, total, tax_paid, metadata) VALUES (?, ?, ?, ?, ?);`, params: [returnId, fi.code || null, fi.total || 0, fi.tax_paid || 0, JSON.stringify(fi.metadata || {})] });
      });
    }

    if (incomes.other && Array.isArray(incomes.other)) {
      incomes.other.forEach(o => {
        incomeStatements.push({ sql: `INSERT INTO other_sources (return_id, code, total, exempt, normal, metadata) VALUES (?, ?, ?, ?, ?, ?);`, params: [returnId, o.code || null, o.total || 0, o.exempt || 0, o.normal || 0, JSON.stringify(o.metadata || {})] });
      });
    }

    if (incomeStatements.length > 0) await runTransaction(db, incomeStatements);

    // Save tax calculation cache if provided
    if (taxCalculation) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO tax_calculations (return_id, taxable_income, tax_year, tax_slab_id, tax_rate, calculated_tax, notes) VALUES (?, ?, ?, ?, ?, ?, ?);`, [returnId, taxCalculation.taxable_income, taxCalculation.tax_year || taxReturn.tax_year, taxCalculation.tax_slab_id || null, taxCalculation.tax_rate || null, taxCalculation.calculated_tax || 0, taxCalculation.notes || null], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    // Save wealth statement if provided
    if (wealth) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO wealth_statements (return_id, assets_json, liabilities_json, net_worth) VALUES (?, ?, ?, ?);`, [returnId, JSON.stringify(wealth.assets || {}), JSON.stringify(wealth.liabilities || {}), wealth.net_worth || 0], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    res.json({ success: true, clientId, returnId });
  } catch (error) {
    console.error('Error creating return:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a lightweight return summary (no heavy income details)
router.get('/returns/:id/summary', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;

  try {
    const summary = await new Promise((resolve, reject) => {
      db.get(`SELECT r.id, r.client_id, r.tax_year, r.status, r.summary, c.name as client_name, c.cnic, c.ntn FROM returns r JOIN clients c ON c.id = r.client_id WHERE r.id = ?;`, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!summary) return res.status(404).json({ success: false, error: 'Return not found' });

    // counts for income sections (lazy indicators)
    const counts = await new Promise((resolve, reject) => {
      db.get(`
        SELECT
          (SELECT COUNT(*) FROM salary_income WHERE return_id = ?) as salary_count,
          (SELECT COUNT(*) FROM business_income WHERE return_id = ?) as business_count,
          (SELECT COUNT(*) FROM property_income WHERE return_id = ?) as property_count,
          (SELECT COUNT(*) FROM capital_gain WHERE return_id = ?) as capital_count,
          (SELECT COUNT(*) FROM foreign_income WHERE return_id = ?) as foreign_count,
          (SELECT COUNT(*) FROM other_sources WHERE return_id = ?) as other_count
      `, [id, id, id, id, id, id], (err, row) => err ? reject(err) : resolve(row));
    });

    res.json({ success: true, summary, counts });
  } catch (error) {
    console.error('Error fetching return summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get full return (all incomes)
router.get('/returns/:id/full', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;

  try {
    const ret = await new Promise((resolve, reject) => db.get('SELECT * FROM returns WHERE id = ?', [id], (err, r) => err ? reject(err) : resolve(r)));
    if (!ret) return res.status(404).json({ success: false, error: 'Return not found' });

    const [salary, business, property, capital, foreigns, other, taxCalc, wealth] = await Promise.all([
      new Promise((resolve, reject) => db.all('SELECT * FROM salary_income WHERE return_id = ?', [id], (err, rows) => err ? reject(err) : resolve(rows))),
      new Promise((resolve, reject) => db.all('SELECT * FROM business_income WHERE return_id = ?', [id], (err, rows) => err ? reject(err) : resolve(rows))),
      new Promise((resolve, reject) => db.all('SELECT * FROM property_income WHERE return_id = ?', [id], (err, rows) => err ? reject(err) : resolve(rows))),
      new Promise((resolve, reject) => db.all('SELECT * FROM capital_gain WHERE return_id = ?', [id], (err, rows) => err ? reject(err) : resolve(rows))),
      new Promise((resolve, reject) => db.all('SELECT * FROM foreign_income WHERE return_id = ?', [id], (err, rows) => err ? reject(err) : resolve(rows))),
      new Promise((resolve, reject) => db.all('SELECT * FROM other_sources WHERE return_id = ?', [id], (err, rows) => err ? reject(err) : resolve(rows))),
      new Promise((resolve, reject) => db.get('SELECT * FROM tax_calculations WHERE return_id = ? ORDER BY calculation_date DESC LIMIT 1', [id], (err, row) => err ? reject(err) : resolve(row))),
      new Promise((resolve, reject) => db.get('SELECT * FROM wealth_statements WHERE return_id = ? ORDER BY updated_at DESC LIMIT 1', [id], (err, row) => err ? reject(err) : resolve(row)))
    ]);

    res.json({ success: true, return: ret, incomes: { salary, business, property, capital, foreign: foreigns, other }, taxCalc, wealth });
  } catch (error) {
    console.error('Error fetching full return:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update an existing return and replace incomes (transactional)
router.put('/returns/:id', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const payload = req.body || {};
  const retUpdates = payload.return || {};
  const incomes = payload.incomes || {};
  const taxCalculation = payload.taxCalculation || null;
  const wealth = payload.wealth || null;

  try {
    // Transaction steps: update returns, delete existing incomes, insert new incomes, update/insert tax calculation and wealth
    const statements = [];

    statements.push({ sql: `UPDATE returns SET tax_year = ?, status = ?, summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`, params: [retUpdates.tax_year || null, retUpdates.status || 'draft', JSON.stringify(retUpdates.summary || {}), id] });

    // Delete previous incomes for this return
    statements.push({ sql: `DELETE FROM salary_income WHERE return_id = ?;`, params: [id] });
    statements.push({ sql: `DELETE FROM business_income WHERE return_id = ?;`, params: [id] });
    statements.push({ sql: `DELETE FROM property_income WHERE return_id = ?;`, params: [id] });
    statements.push({ sql: `DELETE FROM capital_gain WHERE return_id = ?;`, params: [id] });
    statements.push({ sql: `DELETE FROM foreign_income WHERE return_id = ?;`, params: [id] });
    statements.push({ sql: `DELETE FROM other_sources WHERE return_id = ?;`, params: [id] });

    // Prepare income inserts
    if (incomes.salary && Array.isArray(incomes.salary)) {
      incomes.salary.forEach(s => {
        statements.push({ sql: `INSERT INTO salary_income (return_id, code, total, exempt, normal, metadata) VALUES (?, ?, ?, ?, ?, ?);`, params: [id, s.code || null, s.total || 0, s.exempt || 0, s.normal || 0, JSON.stringify(s.metadata || {})] });
      });
    }

    if (incomes.business && Array.isArray(incomes.business)) {
      incomes.business.forEach(b => {
        statements.push({ sql: `INSERT INTO business_income (return_id, description, total, exempt, normal, metadata) VALUES (?, ?, ?, ?, ?, ?);`, params: [id, b.description || null, b.total || 0, b.exempt || 0, b.normal || 0, JSON.stringify(b.metadata || {})] });
      });
    }

    if (incomes.property && Array.isArray(incomes.property)) {
      incomes.property.forEach(p => {
        statements.push({ sql: `INSERT INTO property_income (return_id, code, receipts, deductions, net, metadata) VALUES (?, ?, ?, ?, ?, ?);`, params: [id, p.code || null, p.receipts || 0, p.deductions || 0, p.net || 0, JSON.stringify(p.metadata || {})] });
      });
    }

    if (incomes.capital && Array.isArray(incomes.capital)) {
      incomes.capital.forEach(cg => {
        statements.push({ sql: `INSERT INTO capital_gain (return_id, description, total, metadata) VALUES (?, ?, ?, ?);`, params: [id, cg.description || null, cg.total || 0, JSON.stringify(cg.metadata || {})] });
      });
    }

    if (incomes.foreign && Array.isArray(incomes.foreign)) {
      incomes.foreign.forEach(fi => {
        statements.push({ sql: `INSERT INTO foreign_income (return_id, code, total, tax_paid, metadata) VALUES (?, ?, ?, ?, ?);`, params: [id, fi.code || null, fi.total || 0, fi.tax_paid || 0, JSON.stringify(fi.metadata || {})] });
      });
    }

    if (incomes.other && Array.isArray(incomes.other)) {
      incomes.other.forEach(o => {
        statements.push({ sql: `INSERT INTO other_sources (return_id, code, total, exempt, normal, metadata) VALUES (?, ?, ?, ?, ?, ?);`, params: [id, o.code || null, o.total || 0, o.exempt || 0, o.normal || 0, JSON.stringify(o.metadata || {})] });
      });
    }

    // Execute transaction for updates
    await runTransaction(db, statements);

    // Update tax calculation: insert new cache entry
    if (taxCalculation) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO tax_calculations (return_id, taxable_income, tax_year, tax_slab_id, tax_rate, calculated_tax, notes) VALUES (?, ?, ?, ?, ?, ?, ?);`, [id, taxCalculation.taxable_income, taxCalculation.tax_year || retUpdates.tax_year, taxCalculation.tax_slab_id || null, taxCalculation.tax_rate || null, taxCalculation.calculated_tax || 0, taxCalculation.notes || null], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    // Update wealth statement (replace existing)
    if (wealth) {
      await new Promise((resolve, reject) => {
        db.run(`DELETE FROM wealth_statements WHERE return_id = ?;`, [id], (err) => {
          if (err) return reject(err);
          db.run(`INSERT INTO wealth_statements (return_id, assets_json, liabilities_json, net_worth) VALUES (?, ?, ?, ?);`, [id, JSON.stringify(wealth.assets || {}), JSON.stringify(wealth.liabilities || {}), wealth.net_worth || 0], (err2) => {
            if (err2) return reject(err2);
            resolve();
          });
        });
      });
    }

    res.json({ success: true, message: 'Return updated' });
  } catch (error) {
    console.error('Error updating return:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
