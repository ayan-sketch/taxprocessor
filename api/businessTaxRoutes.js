const express = require('express');
const router = express.Router();
const { getDatabase } = require('./database');

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

const getCachedSlabs = (year, category) => {
  const cached = slabCache.get(`business:${category}:${year}`);
  if (!cached) return null;

  if (Date.now() - cached.cachedAt > SLAB_CACHE_TTL_MS) {
    slabCache.delete(`business:${category}:${year}`);
    return null;
  }

  return cached.rows;
};

const setCachedSlabs = (year, category, rows) => slabCache.set(`business:${category}:${year}`, { rows, cachedAt: Date.now() });
const clearSlabCache = (year, category) => {
  if (year && category) {
    slabCache.delete(`business:${category}:${year}`);
    return;
  }
  slabCache.clear();
};

// Get all business tax slabs
router.get('/slabs', async (req, res) => {
  try {
    const db = getDatabase();
    db.all('SELECT * FROM business_tax_slabs ORDER BY tax_year DESC, category ASC, income_from ASC', [], (err, rows) => {
      if (err) {
        console.error('Error fetching business tax slabs:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      rows.forEach((row) => {
        setCachedSlabs(row.tax_year, row.category, rows.filter((item) => item.tax_year === row.tax_year && item.category === row.category));
      });

      res.json({ success: true, slabs: rows });
    });
  } catch (error) {
    console.error('Error reading business tax slabs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get business tax slabs by year and category
router.get('/slabs/:year/:category', async (req, res) => {
  try {
    const { year, category } = req.params;
    const cached = getCachedSlabs(year, category);
    if (cached) {
      return res.json({ success: true, slabs: cached });
    }

    const db = getDatabase();
    db.all(
      'SELECT * FROM business_tax_slabs WHERE tax_year = ? AND category = ? ORDER BY income_from ASC',
      [year, category],
      (err, rows) => {
        if (err) {
          console.error('Error fetching business tax slabs:', err);
          return res.status(500).json({ success: false, error: err.message });
        }
        setCachedSlabs(year, category, rows);
        res.json({ success: true, slabs: rows });
      }
    );
  } catch (error) {
    console.error('Error reading business tax slabs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available tax years
router.get('/years', async (req, res) => {
  try {
    const db = getDatabase();
    db.all('SELECT DISTINCT tax_year FROM business_tax_slabs ORDER BY tax_year DESC', [], (err, rows) => {
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

// Get available categories
router.get('/categories', async (req, res) => {
  try {
    const db = getDatabase();
    db.all('SELECT DISTINCT category FROM business_tax_slabs ORDER BY category ASC', [], (err, rows) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      const categories = rows.map((row) => row.category);
      res.json({ success: true, categories });
    });
  } catch (error) {
    console.error('Error reading categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new business tax slab
router.post('/slabs', requireAdmin, async (req, res) => {
  try {
    const { tax_year, category, code, description, income_from, income_to, fixed_tax, rate_percent, min_tax, additional_tax, surcharge, adjustable_tax, is_active } = req.body;

    if (!tax_year || !category || income_from === undefined || fixed_tax === undefined || rate_percent === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const db = getDatabase();
    const query = `
      INSERT INTO business_tax_slabs (tax_year, category, code, description, income_from, income_to, fixed_tax, rate_percent, min_tax, additional_tax, surcharge, adjustable_tax, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [
        tax_year.toString(),
        category.toString(),
        code || null,
        description || null,
        parseFloat(income_from),
        income_to ? parseFloat(income_to) : null,
        parseFloat(fixed_tax),
        parseFloat(rate_percent),
        min_tax !== undefined ? parseFloat(min_tax) : 0,
        additional_tax !== undefined ? parseFloat(additional_tax) : 0,
        surcharge !== undefined ? parseFloat(surcharge) : 0,
        adjustable_tax !== undefined ? parseFloat(adjustable_tax) : 0,
        is_active !== false ? 1 : 0
      ],
      function(err) {
        if (err) {
          console.error('Error adding business tax slab:', err);
          return res.status(500).json({ success: false, error: err.message });
        }

        clearSlabCache();
        db.get('SELECT * FROM business_tax_slabs WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            console.error('Error fetching new slab:', err);
            return res.status(500).json({ success: false, error: err.message });
          }
          res.json({ success: true, slab: row });
        });
      }
    );
  } catch (error) {
    console.error('Error adding business tax slab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update business tax slab
router.put('/slabs/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { tax_year, category, code, description, income_from, income_to, fixed_tax, rate_percent, min_tax, additional_tax, surcharge, adjustable_tax, is_active } = req.body;

    const db = getDatabase();
    const updates = [];
    const values = [];

    if (tax_year !== undefined) {
      updates.push('tax_year = ?');
      values.push(tax_year.toString());
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category.toString());
    }
    if (code !== undefined) {
      updates.push('code = ?');
      values.push(code);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
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
    if (min_tax !== undefined) {
      updates.push('min_tax = ?');
      values.push(parseFloat(min_tax));
    }
    if (additional_tax !== undefined) {
      updates.push('additional_tax = ?');
      values.push(parseFloat(additional_tax));
    }
    if (surcharge !== undefined) {
      updates.push('surcharge = ?');
      values.push(parseFloat(surcharge));
    }
    if (adjustable_tax !== undefined) {
      updates.push('adjustable_tax = ?');
      values.push(parseFloat(adjustable_tax));
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(parseInt(id));

    const query = `UPDATE business_tax_slabs SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
      if (err) {
        console.error('Error updating business tax slab:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Tax slab not found' });
      }

      clearSlabCache();
      db.get('SELECT * FROM business_tax_slabs WHERE id = ?', [parseInt(id)], (err, row) => {
        if (err) {
          console.error('Error fetching updated slab:', err);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, slab: row });
      });
    });
  } catch (error) {
    console.error('Error updating business tax slab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete business tax slab
router.delete('/slabs/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.run('DELETE FROM business_tax_slabs WHERE id = ?', [parseInt(id)], function(err) {
      if (err) {
        console.error('Error deleting business tax slab:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Tax slab not found' });
      }

      clearSlabCache();
      res.json({ success: true, message: 'Tax slab deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting business tax slab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Activate/Deactivate business tax year and category
router.put('/years/:year/categories/:category/activate', requireAdmin, async (req, res) => {
  try {
    const { year, category } = req.params;
    const { is_active } = req.body;
    const db = getDatabase();

    db.run(
      'UPDATE business_tax_slabs SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE tax_year = ? AND category = ?',
      [is_active !== false ? 1 : 0, year, category],
      function(err) {
        if (err) {
          console.error('Error activating business tax year/category:', err);
          return res.status(500).json({ success: false, error: err.message });
        }

        clearSlabCache();
        res.json({
          success: true,
          message: `Business tax year ${year} category ${category} ${is_active ? 'activated' : 'deactivated'}`,
          changes: this.changes
        });
      }
    );
  } catch (error) {
    console.error('Error activating business tax year/category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate business tax for a given income, year, and category
router.post('/calculate', async (req, res) => {
  try {
    const { taxable_income, tax_year, category } = req.body;

    if (taxable_income === undefined || !tax_year || !category) {
      return res.status(400).json({ success: false, error: 'Missing taxable_income, tax_year, or category' });
    }

    const income = parseFloat(taxable_income);
    const db = getDatabase();

    db.all(
      'SELECT * FROM business_tax_slabs WHERE tax_year = ? AND category = ? AND is_active = 1 ORDER BY income_from ASC',
      [tax_year.toString(), category.toString()],
      (err, slabs) => {
        if (err) {
          console.error('Error fetching business tax slabs:', err);
          return res.status(500).json({ success: false, error: err.message });
        }

        if (!slabs.length) {
          return res.status(404).json({ success: false, error: `No active slabs found for ${category} in ${tax_year}` });
        }

        let taxAmount = 0;
        let previousThreshold = 0;
        const breakdown = { fixedTax: 0, variableTax: 0, minTax: 0, additionalTax: 0, surcharge: 0, adjustableTax: 0 };

        slabs.forEach((slab) => {
          const lowerBound = Number(slab.income_from || 0);
          const upperBound = slab.income_to === null || slab.income_to === undefined || slab.income_to === ''
            ? income
            : Math.min(income, Number(slab.income_to));
          const taxablePortion = Math.max(0, upperBound - Math.max(previousThreshold, lowerBound));

          if (taxablePortion > 0) {
            const variableTax = Math.round((taxablePortion * Number(slab.rate_percent || 0)) / 100);
            const fixedTax = Math.round(Number(slab.fixed_tax || 0));
            const minTax = Math.round(Number(slab.min_tax || 0));
            const additionalTax = Math.round(Number(slab.additional_tax || 0));
            const surcharge = Math.round(Number(slab.surcharge || 0));
            const adjustableTax = Math.round(Number(slab.adjustable_tax || 0));

            breakdown.variableTax += variableTax;
            breakdown.fixedTax += fixedTax;
            breakdown.minTax += minTax;
            breakdown.additionalTax += additionalTax;
            breakdown.surcharge += surcharge;
            breakdown.adjustableTax += adjustableTax;

            taxAmount += variableTax + fixedTax + minTax + additionalTax + surcharge + adjustableTax;
          }

          previousThreshold = Math.max(previousThreshold, upperBound);
        });

        const result = {
          totalTax: taxAmount,
          breakdown,
          slab: slabs[0]
        };

        const notes = JSON.stringify({
          calculated_by: req.headers['x-user-name'] || 'system',
          slab_label: `${result.slab.income_from}-${result.slab.income_to ?? '∞'}`,
          category
        });

        db.run(
          `INSERT INTO tax_calculations (return_id, taxable_income, tax_year, tax_slab_id, tax_rate, calculated_tax, calculation_date, notes) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
          [0, income, tax_year.toString(), result.slab.id || null, result.slab.rate_percent || null, result.totalTax, notes],
          (insertErr) => {
            if (insertErr) {
              console.error('Error storing business tax calculation:', insertErr);
            }

            res.json({
              success: true,
              tax: result.totalTax,
              breakdown: result.breakdown,
              slab: result.slab,
              calculation: {
                taxable_income: income,
                tax_year: tax_year,
                category: category,
                applicable_slab: result.slab,
                ...result.breakdown,
                total_tax: result.totalTax
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error calculating business tax:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clone slabs from previous year
router.post('/slabs/clone', requireAdmin, async (req, res) => {
  try {
    const { from_year, to_year, category } = req.body;

    if (!from_year || !to_year || !category) {
      return res.status(400).json({ success: false, error: 'Missing from_year, to_year, or category' });
    }

    const db = getDatabase();
    
    // Get slabs from source year
    db.all(
      'SELECT * FROM business_tax_slabs WHERE tax_year = ? AND category = ? ORDER BY income_from ASC',
      [from_year.toString(), category.toString()],
      (err, sourceSlabs) => {
        if (err) {
          console.error('Error fetching source slabs:', err);
          return res.status(500).json({ success: false, error: err.message });
        }

        if (!sourceSlabs.length) {
          return res.status(404).json({ success: false, error: `No slabs found for ${category} in ${from_year}` });
        }

        // Insert cloned slabs for target year
        const stmt = db.prepare(`
          INSERT INTO business_tax_slabs (tax_year, category, income_from, income_to, fixed_tax, rate_percent, min_tax, additional_tax, surcharge, adjustable_tax, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `);

        let completed = 0;
        sourceSlabs.forEach((slab, index) => {
          stmt.run([
            to_year.toString(),
            category.toString(),
            slab.income_from,
            slab.income_to,
            slab.fixed_tax,
            slab.rate_percent,
            slab.min_tax || 0,
            slab.additional_tax || 0,
            slab.surcharge || 0,
            slab.adjustable_tax || 0
          ], (err) => {
            if (err) {
              console.error(`Error inserting cloned slab ${index + 1}:`, err);
            }
            completed++;
            if (completed === sourceSlabs.length) {
              stmt.finalize();
              clearSlabCache();
              res.json({ 
                success: true, 
                message: `Cloned ${sourceSlabs.length} slabs from ${from_year} to ${to_year} for ${category}`,
                count: sourceSlabs.length
              });
            }
          });
        });
      }
    );
  } catch (error) {
    console.error('Error cloning business tax slabs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;