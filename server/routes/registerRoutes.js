// server/routes/registerRoutes.js
const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

router.post('/', async (req, res) => {
  const { MaPhieuDangKy, MaKhachHang, MaThanhToan, TrangThaiPhieu, NgayDangKy } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('MaPDK', sql.VarChar(20), MaPhieuDangKy)
      .input('MaKH', sql.VarChar(20), MaKhachHang)
      .input('MaTT', sql.VarChar(20), MaThanhToan || 'Không')
      .input('TrangThai', sql.NVarChar(100), TrangThaiPhieu)
      .input('NgayDK', sql.Date, NgayDangKy)
      .query(`
        INSERT INTO PhieuDangKy (MaPhieuDangKy, MaKhachHang, MaThanhToan, TrangThaiPhieu, NgayDangKy)
        VALUES (@MaPDK, @MaKH, @MaTT, @TrangThai, @NgayDK)
      `);
    res.json({ message: 'Tạo phiếu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tạo phiếu' });
  }
});

module.exports = router;
