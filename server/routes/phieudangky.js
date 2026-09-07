const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// Lấy danh sách phiếu
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM PHIEUDANGKY ORDER BY NgayDangKy DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Lỗi lấy danh sách phiếu:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách phiếu' });
  }
});

// Tạo phiếu mới
router.post('/', async (req, res) => {
    const {
      MaKhachHang,
      NgayDangKy,
      TrangThaiPhieu = 'Đang xử lý',
      MaThanhToan,
      NguoiTao
    } = req.body;
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`SELECT COUNT(*) AS SoLuong FROM PHIEUDANGKY`);
      const MaPhieuDangKy = 'PDK' + (result.recordset[0].SoLuong + 1).toString().padStart(4, '0');
  
      await pool.request()
        .input('MaPhieuDangKy', sql.VarChar(20), MaPhieuDangKy)
        .input('MaKhachHang', sql.VarChar(20), MaKhachHang)
        .input('NgayDangKy', sql.Date, NgayDangKy)
        .input('TrangThaiPhieu', sql.NVarChar(100), TrangThaiPhieu)
        .input('MaThanhToan', sql.VarChar(20), MaThanhToan || 'Không')
        .input('NguoiTao', sql.VarChar(20), NguoiTao)
        .query(`
          INSERT INTO PHIEUDANGKY (MaPhieuDangKy, MaKhachHang, NgayDangKy, TrangThaiPhieu, MaThanhToan, NguoiTao)
          VALUES (@MaPhieuDangKy, @MaKhachHang, @NgayDangKy, @TrangThaiPhieu, @MaThanhToan, @NguoiTao)
        `);
  
      res.json({ message: 'Tạo phiếu đăng ký thành công!' });
    } catch (err) {
      console.error('Lỗi khi tạo phiếu:', err);
      res.status(500).json({ error: 'Lỗi server khi tạo phiếu' });
    }
  });  

module.exports = router;
