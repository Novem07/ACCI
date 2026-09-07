// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

router.post('/login', async (req, res) => {
  const { maNhanVien, matKhau } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('maNhanVien', sql.Char, maNhanVien)
      .input('matKhau', sql.Char, matKhau)
      .query(`
        SELECT MaNhanVien, HoTen, Email, VaiTro
        FROM NhanVien
        WHERE LTRIM(RTRIM(MaNhanVien)) = LTRIM(RTRIM(@maNhanVien)) AND
        LTRIM(RTRIM(MatKhau)) = LTRIM(RTRIM(@matKhau))
      `);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      return res.json({
        user: {
          maNV: user.MaNhanVien,
          name: user.HoTen,
          email: user.Email,
          vaiTro: user.VaiTro
        }
      });
    } else {
      return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});

module.exports = router;
