// routes/reports.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { description, location } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO reports (description, location) VALUES ($1, $2) RETURNING *',
      [description, location]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
