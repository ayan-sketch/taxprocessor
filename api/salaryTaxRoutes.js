const express = require('express');
const router = express.Router();
const { getDatabase } = require('./database');
const { calculateSalaryTaxFromSlabs } = require('./salaryTaxService');

const SLAB_CACHE_TTL_MS = 60 * 60 * 1000;
const slabCache = new Map();

const getCurrentUserRole = (req) => {
  const role = req.headers['x-user-role'] || req.headers['x-role'] || req.headers['x-admin-role'];
  return role ? String(role).toLowerCase() : 'viewer';
};

const requireAdmin = (req, res, next) => {
  if (getCurrentUserRole(req) !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

const getCachedSlabs = (year) => {
  const cached = slabCache.get(`slabs:${year}`);
  if (!cached) return null;

  if (Date.now() - cached.cachedAt > SLAB_CACHE_TTL_MS) {
    slabCache.delete(`slabs:${year}`);
    return null;
  }

  return cached.rows;
};
const setCachedSlabs = (year, rows) => slabCache.set(`slabs:${year}`, { rows, cachedAt: Date.now() });
const clearSlabCache = (year) => {
  if (year) {
    slabCache.delete(`slabs:${year}`);
    return;
  }

  slabCache.clear();
};

// Get all tax slabs
router.get('/slabs', async (req, res) => {
  try {
    const db = getDatabase();
    db.all('SELECT * FROM salary_tax_slabs ORDER BY tax_year DESC, income_from ASC', [], (err, rows) => {
      if (err) {
        console.error('Error fetching tax slabs:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      rows.forEach((row) => {
        setCachedSlabs(row.tax_year, rows.filter((item) => item.tax_year === row.tax_year));
      });

      res.json({ success: true, slabs: rows });
    });
  } catch (error) {
    console.error('Error reading tax slabs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tax slabs by year
router.get('/slabs/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const cached = getCachedSlabs(year);
    if (cached) {
      return res.json({ success: true, slabs: cached });
    }

    const db = getDatabase();
    db.all(
      'SELECT * FROM salary_tax_slabs WHERE tax_year = ? ORDER BY income_from ASC',
      [year],
      (err, rows) => {
        if (err) {
          console.error('Error fetching tax slabs:', err);
          return res.status(500).json({ success: false, error: err.message });
        }
        setCachedSlabs(year, rows);
        res.json({ success: true, slabs: rows });
      }
    );
  } catch (error) {
    console.error('Error reading tax slabs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available tax years
router.get('/years', async (req, res) => {
  try {
    const db = getDatabase();
    db.all('SELECT DISTINCT tax_year FROM salary_tax_slabs ORDER BY tax_year DESC', [], (err, rows) => {
      if (err) {
        console.error('Error fetching tax years:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      const years = rows.map((row) => row.tax_year);
      res.json({ success: true, years });
    });
  } catch (error) {
    console.error('Error reading tax years:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new tax slab
router.post('/slabs', requireAdmin, async (req, res) => {
  try {
    const { tax_year, income_from, income_to, fixed_tax, rate_percent, tax_credit, additional_tax, is_active } = req.body;

    if (!tax_year || income_from === undefined || fixed_tax === undefined || rate_percent === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const db = getDatabase();
    const query = `
      INSERT INTO salary_tax_slabs (tax_year, income_from, income_to, fixed_tax, rate_percent, tax_credit, additional_tax, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [
        tax_year.toString(),
        parseFloat(income_from),
        income_to ? parseFloat(income_to) : null,
        parseFloat(fixed_tax),
        parseFloat(rate_percent),
        tax_credit !== undefined ? parseFloat(tax_credit) : 0,
        additional_tax !== undefined ? parseFloat(additional_tax) : 0,
        is_active !== false ? 1 : 0
      ],
      function(err) {
        if (err) {
          console.error('Error adding tax slab:', err);
          return res.status(500).json({ success: false, error: err.message });
        }

        clearSlabCache();
        db.get('SELECT * FROM salary_tax_slabs WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            console.error('Error fetching new slab:', err);
            return res.status(500).json({ success: false, error: err.message });
          }
          res.json({ success: true, slab: row });
        });
      }
    );
  } catch (error) {
    console.error('Error adding tax slab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update tax slab
router.put('/slabs/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { tax_year, income_from, income_to, fixed_tax, rate_percent, tax_credit, additional_tax, is_active } = req.body;

    const db = getDatabase();
    const updates = [];
    const values = [];

    if (tax_year !== undefined) {
      updates.push('tax_year = ?');
      values.push(tax_year.toString());
    }
    if (income_from !== undefined) {
      updates.push('income_from = ?');
      values.push(parseFloat(income_from));
    }
    if (income_to !== undefined) {
      updates.push('income_to = ?');
      values.push(income_to ? parseFloat(income_to) : null);
    }
    if (fixed_tax !== undefined) {
      updates.push('fixed_tax = ?');
      values.push(parseFloat(fixed_tax));
    }
    if (rate_percent !== undefined) {
      updates.push('rate_percent = ?');
      values.push(parseFloat(rate_percent));
    }
    if (tax_credit !== undefined) {
      updates.push('tax_credit = ?');
      values.push(parseFloat(tax_credit));
    }
    if (additional_tax !== undefined) {
      updates.push('additional_tax = ?');
      values.push(parseFloat(additional_tax));
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(parseInt(id));

    const query = `UPDATE salary_tax_slabs SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
      if (err) {
        console.error('Error updating tax slab:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Tax slab not found' });
      }

      clearSlabCache();
      db.get('SELECT * FROM salary_tax_slabs WHERE id = ?', [parseInt(id)], (err, row) => {
        if (err) {
          console.error('Error fetching updated slab:', err);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, slab: row });
      });
    });
  } catch (error) {
    console.error('Error updating tax slab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete tax slab
router.delete('/slabs/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.run('DELETE FROM salary_tax_slabs WHERE id = ?', [parseInt(id)], function(err) {
      if (err) {
        console.error('Error deleting tax slab:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Tax slab not found' });
      }

      clearSlabCache();
      res.json({ success: true, message: 'Tax slab deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting tax slab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Activate/Deactivate tax year
router.put('/years/:year/activate', requireAdmin, async (req, res) => {
  try {
    const { year } = req.params;
    const { is_active } = req.body;
    const db = getDatabase();

    db.run(
      'UPDATE salary_tax_slabs SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE tax_year = ?',
      [is_active !== false ? 1 : 0, year],
      function(err) {
        if (err) {
          console.error('Error activating tax year:', err);
          return res.status(500).json({ success: false, error: err.message });
        }

        clearSlabCache();
        res.json({
          success: true,
          message: `Tax year ${year} ${is_active ? 'activated' : 'deactivated'}`,
          changes: this.changes
        });
      }
    );
  } catch (error) {
    console.error('Error activating tax year:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate salary tax for a given income and year
router.post('/calculate', async (req, res) => {
  try {
    const { taxable_income, tax_year } = req.body;

    if (taxable_income === undefined || !tax_year) {
      return res.status(400).json({ success: false, error: 'Missing taxable_income or tax_year' });
    }

    const income = parseFloat(taxable_income);
    const db = getDatabase();

    db.all(
      'SELECT * FROM salary_tax_slabs WHERE tax_year = ? AND is_active = 1 ORDER BY income_from ASC',
      [tax_year.toString()],
      (err, slabs) => {
        if (err) {
          console.error('Error fetching tax slabs:', err);
          return res.status(500).json({ success: false, error: err.message });
        }

        const result = calculateSalaryTaxFromSlabs(income, slabs);
        if (!result.success) {
          return res.status(404).json({ success: false, error: result.error });
        }

        const notes = JSON.stringify({
          calculated_by: req.headers['x-user-name'] || 'system',
          slab_label: `${result.slab.income_from}-${result.slab.income_to ?? '∞'}`
        });

        db.run(
          `INSERT INTO tax_calculations (return_id, taxable_income, tax_year, tax_slab_id, tax_rate, calculated_tax, calculation_date, notes) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
          [0, income, tax_year.toString(), result.slab.id || null, result.slab.rate_percent || null, result.totalTax, notes],
          (insertErr) => {
            if (insertErr) {
              console.error('Error storing salary tax calculation:', insertErr);
            }

            res.json({
              success: true,
              tax: result.totalTax,
              breakdown: result.breakdown,
              slab: result.slab,
              calculation: {
                taxable_income: income,
                tax_year: tax_year,
                applicable_slab: result.slab,
                fixed_tax: result.breakdown.fixedTax,
                variable_tax: result.breakdown.variableTax,
                total_tax: result.totalTax
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error calculating tax:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
