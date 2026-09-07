const express = require('express');

const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');
const { sql } = require('../db');

function createCatalogRouter({ db, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));
  const staff = requireRole('Tiếp nhận', 'Kế Toán', 'Tổ chức thi', 'Nhập liệu', 'Coi thi');

  router.get('/certificates', staff, async (req, res, next) => {
    try {
      const result = await db.request().query(`
        SELECT MaChungChi AS id, TenChungChi AS name, MoTa AS description,
               LoaiChungChi AS type, ThoiHan AS validityMonths, Gia AS price
        FROM ChungChi
        ORDER BY MaChungChi
      `);
      res.json({ certificates: result.recordset });
    } catch (error) {
      next(error);
    }
  });

  router.get('/candidates', staff, async (req, res, next) => {
    try {
      const result = await db.request()
        .input('query', sql.VarChar(50), req.query.query ? `%${String(req.query.query).trim()}%` : null)
        .query(`
          SELECT ts.MaThiSinh AS id, ts.HoTen AS fullName, ts.CCCD AS citizenId,
                 ts.SDT AS phone, ts.Email AS email, ts.DiaChi AS address,
                 ts.MaKhachHang AS customerId
          FROM ThiSinh ts
          WHERE @query IS NULL OR ts.MaThiSinh LIKE @query OR ts.HoTen LIKE @query
          ORDER BY ts.MaThiSinh
        `);
      res.json({ candidates: result.recordset });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createCatalogRouter };
