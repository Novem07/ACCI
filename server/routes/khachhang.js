// 📁 server/routes/khachhang.js
const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// GET: Lấy danh sách mã khách hàng
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT MaKhachHang FROM KhachHang');
    return res.status(200).json(result.recordset || []);
  } catch (err) {
    console.error('[GET /khachhang] Lỗi:', err);
    return res.status(500).json({ message: 'Lỗi server khi lấy danh sách khách hàng' });
  }
});

// GET: Lấy thông tin chi tiết khách hàng
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query('SELECT * FROM KhachHang WHERE MaKhachHang = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error('[GET /khachhang/:id] Lỗi:', err);
    return res.status(500).json({ message: 'Lỗi server khi lấy chi tiết khách hàng' });
  }
});

module.exports = router;
