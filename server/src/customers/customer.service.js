const { sql } = require('../db');
const { httpError } = require('../errors');

function formatId(prefix, value) {
  return `${prefix}${String(value).padStart(6, '0')}`;
}

async function nextId(db, sequenceName, prefix) {
  const result = await db.request().query(`SELECT NEXT VALUE FOR dbo.${sequenceName} AS value`);
  return formatId(prefix, result.recordset[0].value);
}

function createCustomerService({ db }) {
  return {
    async list({ page, pageSize, query }) {
      const offset = (page - 1) * pageSize;
      const search = `%${query.replace(/[\\%_\[]/g, '\\$&')}%`;
      const bindFilters = (request) => request
        .input('query', sql.NVarChar(100), query)
        .input('search', sql.NVarChar(202), search);
      const whereClause = `
        WHERE (@query = N'' OR MaKhachHang LIKE @search ESCAPE '\\'
          OR HoTen LIKE @search ESCAPE '\\' OR SDT LIKE @search ESCAPE '\\')
      `;

      const countResult = await bindFilters(db.request()).query(`
        SELECT COUNT_BIG(*) AS totalItems
        FROM KhachHang
        ${whereClause}
      `);
      const totalItems = Number(countResult.recordset[0].totalItems);
      const result = await bindFilters(db.request())
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize)
        .query(`
        SELECT MaKhachHang AS id, HoTen AS fullName, CCCD AS citizenId,
               SDT AS phone, Email AS email, DiaChi AS address, DonVi AS organization
        FROM KhachHang
        ${whereClause}
        ORDER BY MaKhachHang
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

    async get(customerId) {
      const result = await db.request()
          .input('customerId', sql.VarChar(20), customerId)
          .query(`
          SELECT MaKhachHang AS id, HoTen AS fullName, CCCD AS citizenId,
                 SDT AS phone, Email AS email, DiaChi AS address, DonVi AS organization
          FROM KhachHang
          WHERE MaKhachHang = @customerId
        `);
      const customer = result.recordset[0];
      if (!customer) throw httpError(404, 'CUSTOMER_NOT_FOUND', 'Không tìm thấy khách hàng.');
      return customer;
    },

    async create(input) {
      const id = await nextId(db, 'SeqKhachHang', 'KH');
      await db.request()
        .input('customerId', sql.VarChar(20), id)
        .input('fullName', sql.NVarChar(100), input.fullName)
        .input('citizenId', sql.VarChar(20), input.citizenId || null)
        .input('phone', sql.VarChar(15), input.phone)
        .input('email', sql.VarChar(100), input.email)
        .input('address', sql.NVarChar(200), input.address)
        .input('organization', sql.VarChar(20), input.organization)
        .query(`
          INSERT INTO KhachHang (MaKhachHang, HoTen, CCCD, SDT, Email, DiaChi, DonVi)
          VALUES (@customerId, @fullName, @citizenId, @phone, @email, @address, @organization)
        `);
      return { id, ...input };
    },
  };
}

module.exports = { createCustomerService, formatId, nextId };
