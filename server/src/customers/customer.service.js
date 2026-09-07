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
    async list() {
      const result = await db.request().query(`
        SELECT MaKhachHang, HoTen, CCCD, SDT, Email, DiaChi, DonVi
        FROM KhachHang
        ORDER BY MaKhachHang
      `);
      return result.recordset;
    },

    async get(customerId) {
      const result = await db.request()
        .input('customerId', sql.VarChar(20), customerId)
        .query(`
          SELECT MaKhachHang, HoTen, CCCD, SDT, Email, DiaChi, DonVi
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
