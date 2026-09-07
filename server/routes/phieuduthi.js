const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// GET toàn bộ phiếu dự thi
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        p.MaPhieuDuThi,
        p.MaThiSinh,
        c.TenChungChi,
        p.TrangThaiPhieu,
        p.SoLanGiaHanConLai,
        CONVERT(varchar(10), p.NgayThi, 120) AS NgayThi,
        CONVERT(varchar(8), p.GioThi, 108) AS GioThi        
      FROM PhieuDuThi p
      JOIN ChungChi c ON p.MaChungChi = c.MaChungChi
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Lỗi API /phieuduthi:', err);
    res.status(500).send('Lỗi server khi lấy phiếu dự thi');
  }
});

// GET chi tiết phiếu dự thi theo ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query(`
        SELECT pd.MaPhieuDuThi, ts.CCCD, ts.SDT, ts.Email, ts.DiaChi,
               pd.SoBaoDanh, cc.TenChungChi, pd.NgayThi, pd.GioThi, pd.SoLanGiaHanConLai
        FROM PhieuDuThi pd
        JOIN ThiSinh ts ON pd.MaThiSinh = ts.MaThiSinh
        JOIN ChungChi cc ON pd.MaChungChi = cc.MaChungChi
        WHERE pd.MaPhieuDuThi = @id
      `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server khi lấy chi tiết phiếu');
  }
});

// PUT /giahan/:maPhieu – xử lý gia hạn
router.put('/giahan/:maPhieu', async (req, res) => {
  const { maPhieu } = req.params;
  const { caseType, newExamDate } = req.body;

  try {
    const pool = await poolPromise;

    // Kiểm tra số lần gia hạn còn lại
    const check = await pool.request()
      .input('maPhieu', sql.VarChar, maPhieu)
      .query('SELECT SoLanGiaHanConLai FROM PhieuDuThi WHERE MaPhieuDuThi = @maPhieu');

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu dự thi' });
    }

    const current = check.recordset[0];
    if (current.SoLanGiaHanConLai <= 0) {
      return res.status(400).json({ message: 'Đã hết số lần gia hạn' });
    }

    // Cập nhật ngày thi mới và giảm số lần còn lại
    await pool.request()
      .input('maPhieu', sql.VarChar, maPhieu)
      .input('ngayThi', sql.Date, newExamDate)
      .query(`
        UPDATE PhieuDuThi
        SET NgayThi = @ngayThi,
            SoLanGiaHanConLai = SoLanGiaHanConLai - 1
        WHERE MaPhieuDuThi = @maPhieu
      `);

    res.json({ message: 'Gia hạn phiếu thành công!' });
  } catch (err) {
    console.error('Lỗi khi cập nhật gia hạn:', err);
    res.status(500).json({ message: 'Lỗi server khi gia hạn phiếu' });
  }
});

module.exports = router;
