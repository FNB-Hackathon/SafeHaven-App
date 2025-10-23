// routes/alerts.js
const express = require('express');
const router = express.Router();
let pool = null;
try {
  pool = require('../db');
} catch (_) {}
const store = require('../store');

router.get('/', async (req, res) => {
  if (pool && process.env.DATABASE_URL) {
    try {
      const result = await pool.query('SELECT * FROM alerts');
      return res.json(result.rows);
    } catch (err) {
      // fall through to memory
    }
  }
  res.json(store.alerts);
});

module.exports = router;
