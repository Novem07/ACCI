const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');

// GET: danh sách chứng chỉ
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT MaChungChi, TenChungChi FROM ChungChi');
    res.json(result.recordset || []);
  } catch (err) {
    console.error('Lỗi lấy danh sách chứng chỉ:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy chứng chỉ' });
  }
});

module.exports = router;
