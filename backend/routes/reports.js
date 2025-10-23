// routes/reports.js
const express = require('express');
const router = express.Router();
let pool = null;
try {
  pool = require('../db');
} catch (_) {}
const store = require('../store');

router.post('/', async (req, res) => {
  const { description, location } = req.body;
  // Try DB first if available
  if (pool && process.env.DATABASE_URL) {
    try {
      const result = await pool.query(
        'INSERT INTO reports (description, location) VALUES ($1, $2) RETURNING *',
        [description, location]
      );
      return res.json(result.rows[0]);
    } catch (err) {
      // fall back to memory on error
    }
  }

  // In-memory fallback
  const report = {
    id: Date.now(),
    description,
    location,
    created_at: new Date().toISOString(),
  };
  store.reports.unshift(report);
  store.alerts.unshift({
    id: report.id,
    description,
    location,
    created_at: report.created_at,
  });
  res.json(report);
});

module.exports = router;
