const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT 
          pd.MaPhieuDangKy AS MaPDK, 
          pd.MaKhachHang AS MaKH,
          pd.MaThanhToan AS MaTT,
          FORMAT(pd.NgayDangKy, 'dd/MM/yyyy') AS NgayDK,
          pd.TrangThaiPhieu AS TrangThai,
          kh.DonVi,
          CASE 
            WHEN kh.DonVi != N'Không' AND hd.MaHoaDon IS NOT NULL THEN 1
            ELSE 0
          END AS DaXuLy
        FROM PhieuDangKy pd
        JOIN KhachHang kh ON pd.MaKhachHang = kh.MaKhachHang
        LEFT JOIN HoaDonDangKy hd ON pd.MaPhieuDangKy = hd.MaPhieuDangKy
      `);      
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('❌ Lỗi khi truy vấn payments:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách thanh toán' });
  }
});

router.get('/phieu/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('MaPDK', sql.VarChar, id)
        .query(`
          SELECT 
            pd.MaPhieuDangKy AS MaPDK,
            pd.MaKhachHang AS MaKH,
            kh.HoTen,
            kh.SDT,
            kh.DonVi,
            pd.MaThanhToan AS MaTT,
            FORMAT(pd.NgayDangKy, 'dd/MM/yyyy') AS NgayDK,
            pd.TrangThaiPhieu AS TrangThai,
            hd.MaHoaDon,
            FORMAT(hd.NgayLapHoaDon, 'dd/MM/yyyy') AS NgayLap,
            hd.TongTien,
            hd.PhuongThucThanhToan,
            hd.TroGia,
            hd.NguoiTao
          FROM PhieuDangKy pd
          JOIN KhachHang kh ON pd.MaKhachHang = kh.MaKhachHang
          LEFT JOIN HoaDonDangKy hd ON hd.MaPhieuDangKy = pd.MaPhieuDangKy
          WHERE pd.MaPhieuDangKy = @MaPDK
        `);
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu đăng ký' });
      }
  
      res.status(200).json(result.recordset[0]);
    } catch (err) {
      console.error('❌ Lỗi khi truy vấn phiếu:', err);
      res.status(500).json({ message: 'Lỗi server khi lấy thông tin phiếu' });
    }
  });  

  router.get('/khachhang/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('MaPDK', sql.VarChar, maPDK)
        .query(`
            SELECT P.*, KH.HoTen, KH.SDT, KH.DonVi
            FROM PhieuDangKy P
            JOIN KhachHang KH ON KH.MaKhachHang = P.MaKhachHang
            WHERE P.MaPDK = @MaPDK
        `);

  
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      }
  
      res.status(200).json(result.recordset[0]);
    } catch (err) {
      console.error('❌ Lỗi khi lấy khách hàng:', err);
      res.status(500).json({ message: 'Lỗi server' });
    }
  });
  
  router.get('/tinhtoan/:maPDK', async (req, res) => {
    const { maPDK } = req.params;
  
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('MaPDK', sql.VarChar, maPDK)
        .query(`
          SELECT 
            SUM(CC.Gia) AS Tong, 
            COUNT(PDT.MaPhieuDuThi) AS SoLuong,
            CASE 
              WHEN KH.DonVi = N'Không' THEN 0
              WHEN COUNT(PDT.MaPhieuDuThi) > 20 THEN ROUND(SUM(CC.Gia) * 0.15, 2)
              ELSE ROUND(SUM(CC.Gia) * 0.10, 2)
            END AS TroGia,
            SUM(CC.Gia) -
            CASE 
              WHEN KH.DonVi = N'Không' THEN 0
              WHEN COUNT(PDT.MaPhieuDuThi) > 20 THEN ROUND(SUM(CC.Gia) * 0.15, 2)
              ELSE ROUND(SUM(CC.Gia) * 0.10, 2)
            END AS TongTien
          FROM PhieuDangKy PDK
          JOIN KhachHang KH ON PDK.MaKhachHang = KH.MaKhachHang
          JOIN PhieuDuThi PDT ON PDT.MaPhieuDangKy = PDK.MaPhieuDangKy
          JOIN ChungChi CC ON PDT.MaChungChi = CC.MaChungChi
          WHERE PDK.MaPhieuDangKy = @MaPDK
          GROUP BY KH.DonVi
        `);
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Không tính được giá trị hóa đơn' });
      }
  
      res.status(200).json(result.recordset[0]);
    } catch (err) {
      console.error('❌ Lỗi khi tính toán hóa đơn:', err);
      res.status(500).json({ message: 'Lỗi server khi tính toán hóa đơn' });
    }
  });  

module.exports = router;
