const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM ThiSinh');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});

module.exports = router;
