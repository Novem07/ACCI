const { sql } = require('../db');

function escapeLike(value) {
  return value.replace(/[\\%_\[]/g, '\\$&');
}

function createCatalogService({ db }) {
  return {
    async listCertificates() {
      const result = await db.request().query(`
        SELECT MaChungChi AS id, TenChungChi AS name, MoTa AS description,
               LoaiChungChi AS type, ThoiHan AS validityMonths, Gia AS price
        FROM ChungChi
        ORDER BY MaChungChi
      `);
      return result.recordset;
    },

    async listCandidates({ page, pageSize, query }) {
      const offset = (page - 1) * pageSize;
      const search = `%${escapeLike(query)}%`;
      const bindFilters = (request) => request
        .input('query', sql.NVarChar(100), query)
        .input('search', sql.NVarChar(202), search);
      const whereClause = `
        WHERE (@query = N'' OR ts.MaThiSinh LIKE @search ESCAPE '\\'
          OR ts.HoTen LIKE @search ESCAPE '\\')
      `;
      const countResult = await bindFilters(db.request()).query(`
        SELECT COUNT_BIG(*) AS totalItems
        FROM ThiSinh ts
        ${whereClause}
      `);
      const totalItems = Number(countResult.recordset[0].totalItems);
      const result = await bindFilters(db.request())
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize)
        .query(`
          SELECT ts.MaThiSinh AS id, ts.HoTen AS fullName, ts.CCCD AS citizenId,
                 ts.SDT AS phone, ts.Email AS email, ts.DiaChi AS address,
                 ts.MaKhachHang AS customerId
          FROM ThiSinh ts
          ${whereClause}
          ORDER BY ts.MaThiSinh
          OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
        `);
      return {
        items: result.recordset,
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      };
    },
  };
}

module.exports = { createCatalogService };
