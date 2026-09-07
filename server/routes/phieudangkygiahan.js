const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// POST /api/phieudangkygiahan
router.post('/', async (req, res) => {
  const { maPhieuDuThi, truongHop, lichThiMoi, nguoiTao } = req.body;

  if (!maPhieuDuThi || !truongHop || !lichThiMoi || !nguoiTao) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  try {
    const pool = await poolPromise;
    const now = new Date();

    // Tạo mã phiếu tự động
    const idRes = await pool.request().query(`
      SELECT COUNT(*) AS count FROM PhieuDangKyGiaHan
    `);
    const newId = `PDGH${(idRes.recordset[0].count + 1).toString().padStart(3, '0')}`;

    await pool.request()
      .input('MaPhieuDangKyGiaHan', sql.VarChar(10), newId)
      .input('TruongHop', sql.NVarChar(20), truongHop)
      .input('NgayYeuCau', sql.Date, now)
      .input('LichThiMoi', sql.VarChar(10), lichThiMoi)
      .input('MaPhieuDuThi', sql.VarChar(10), maPhieuDuThi)
      .input('NguoiTao', sql.VarChar(10), nguoiTao)
      .query(`
        INSERT INTO PhieuDangKyGiaHan (
          MaPhieuDangKyGiaHan, TruongHop, NgayYeuCau, LichThiMoi, MaPhieuDuThi, NguoiTao
        ) VALUES (
          @MaPhieuDangKyGiaHan, @TruongHop, @NgayYeuCau, @LichThiMoi, @MaPhieuDuThi, @NguoiTao
        )
      `);

    res.json({ message: 'Tạo phiếu đăng ký gia hạn thành công!' });
  } catch (err) {
    console.error('❌ Lỗi khi tạo phiếu đăng ký gia hạn:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
