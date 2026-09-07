const { sql } = require('../db');
const { httpError } = require('../errors');
const { formatId } = require('../customers/customer.service');

async function quoteQuery(target, registrationId) {
  const result = await target.request()
    .input('registrationId', sql.VarChar(20), registrationId)
    .query(`
      SELECT p.MaPhieuDangKy AS registrationId,
             p.MaKhachHang AS customerId,
             p.NgayDangKy AS registrationDate,
             p.TrangThaiPhieu AS registrationStatus,
             kh.HoTen AS customerName,
             kh.SDT AS customerPhone,
             kh.DonVi AS organization,
             COUNT(ct.MaThiSinh) AS candidateCount,
             COALESCE(SUM(CAST(cc.Gia AS DECIMAL(12,2))), 0) AS baseAmount
      FROM PhieuDangKy p
      JOIN KhachHang kh ON kh.MaKhachHang = p.MaKhachHang
      LEFT JOIN ChiTietPhieuDangKy ct ON ct.MaPhieuDangKy = p.MaPhieuDangKy
      LEFT JOIN ChungChi cc ON cc.MaChungChi = ct.MaChungChi
      WHERE p.MaPhieuDangKy = @registrationId
      GROUP BY p.MaPhieuDangKy, p.MaKhachHang, p.NgayDangKy,
               p.TrangThaiPhieu, kh.HoTen, kh.SDT, kh.DonVi
    `);
  const row = result.recordset[0];
  if (!row) throw httpError(404, 'REGISTRATION_NOT_FOUND', 'Không tìm thấy phiếu đăng ký.');

  const candidateCount = Number(row.candidateCount);
  const baseAmount = Math.round(Number(row.baseAmount));
  const isOrganization = row.organization !== 'Không';
  const discountRate = isOrganization ? (candidateCount > 20 ? 0.15 : 0.10) : 0;
  const discountAmount = Math.round(baseAmount * discountRate);
  return {
    registrationId: row.registrationId,
    customerId: row.customerId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    registrationDate: row.registrationDate,
    registrationStatus: row.registrationStatus,
    candidateCount,
    currency: 'VND',
    baseAmount,
    discountRate,
    discountAmount,
    totalAmount: baseAmount - discountAmount,
  };
}

async function nextInvoiceId(target) {
  const result = await target.request().query('SELECT NEXT VALUE FOR dbo.SeqHoaDonDangKy AS value');
  return formatId('HD', result.recordset[0].value);
}

function createPaymentService({ db, transactionFactory }) {
  const makeTransaction = transactionFactory || (() => new sql.Transaction(db));
  return {
    async list() {
      const result = await db.request().query(`
        SELECT p.MaPhieuDangKy AS registrationId,
               p.MaKhachHang AS customerId,
               p.MaThanhToan AS invoiceId,
               p.NgayDangKy AS registrationDate,
               p.TrangThaiPhieu AS registrationStatus,
               kh.HoTen AS customerName,
               kh.DonVi AS organization
        FROM PhieuDangKy p
        JOIN KhachHang kh ON kh.MaKhachHang = p.MaKhachHang
        ORDER BY p.NgayDangKy DESC, p.MaPhieuDangKy DESC
      `);
      return result.recordset;
    },

    async get(registrationId) {
      const result = await db.request()
        .input('registrationId', sql.VarChar(20), registrationId)
        .query(`
          SELECT p.MaPhieuDangKy AS registrationId,
                 p.MaKhachHang AS customerId,
                 p.MaThanhToan AS invoiceId,
                 p.NgayDangKy AS registrationDate,
                 p.TrangThaiPhieu AS registrationStatus,
                 kh.HoTen AS customerName,
                 kh.SDT AS customerPhone,
                 kh.DonVi AS organization,
                 hd.TongTien AS totalAmount,
                 hd.PhuongThucThanhToan AS paymentMethod,
                 hd.NgayLapHoaDon AS invoiceDate,
                 hd.TrangThaiThanhToan AS paymentStatus
          FROM PhieuDangKy p
          JOIN KhachHang kh ON kh.MaKhachHang = p.MaKhachHang
          LEFT JOIN HoaDonDangKy hd ON hd.MaPhieuDangKy = p.MaPhieuDangKy
          WHERE p.MaPhieuDangKy = @registrationId
        `);
      if (!result.recordset[0]) throw httpError(404, 'REGISTRATION_NOT_FOUND', 'Không tìm thấy phiếu đăng ký.');
      return result.recordset[0];
    },

    async quote(registrationId) {
      return quoteQuery(db, registrationId);
    },

    async createInvoice({ registrationId, input, userId }) {
      const transaction = makeTransaction();
      let started = false;
      try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        started = true;
        const quote = await quoteQuery(transaction, registrationId);
        const existing = await transaction.request()
          .input('registrationId', sql.VarChar(20), registrationId)
          .query('SELECT TOP 1 MaHoaDon FROM HoaDonDangKy WITH (UPDLOCK, HOLDLOCK) WHERE MaPhieuDangKy = @registrationId');
        if (existing.recordset[0]) {
          throw httpError(409, 'INVOICE_ALREADY_EXISTS', 'Phiếu đăng ký đã có hóa đơn.');
        }

        const invoiceId = await nextInvoiceId(transaction);
        const invoiceDate = input.invoiceDate || new Date().toISOString().slice(0, 10);
        await transaction.request()
          .input('invoiceId', sql.VarChar(20), invoiceId)
          .input('registrationId', sql.VarChar(20), registrationId)
          .input('baseAmount', sql.Decimal(12, 2), quote.baseAmount)
          .input('candidateCount', sql.Int, quote.candidateCount)
          .input('discountAmount', sql.Decimal(12, 2), quote.discountAmount)
          .input('totalAmount', sql.Decimal(12, 2), quote.totalAmount)
          .input('invoiceDate', sql.Date, invoiceDate)
          .input('paymentMethod', sql.NVarChar(50), input.paymentMethod)
          .input('userId', sql.VarChar(20), userId)
          .query(`
            INSERT INTO HoaDonDangKy
              (MaHoaDon, MaPhieuDangKy, Gia, SoLuongThiSinh, TroGia, TongTien,
               NgayLapHoaDon, PhuongThucThanhToan, TrangThaiThanhToan, NguoiTao)
            VALUES
              (@invoiceId, @registrationId, @baseAmount, @candidateCount, @discountAmount, @totalAmount,
               @invoiceDate, @paymentMethod, N'Đã thanh toán', @userId)
          `);
        await transaction.request()
          .input('invoiceId', sql.NVarChar(50), invoiceId)
          .input('registrationId', sql.VarChar(20), registrationId)
          .query('UPDATE PhieuDangKy SET MaThanhToan = @invoiceId WHERE MaPhieuDangKy = @registrationId');
        await transaction.commit();
        return { invoiceId, registrationId, totalAmount: quote.totalAmount, currency: 'VND', paymentStatus: 'Đã thanh toán' };
      } catch (error) {
        if (started) await transaction.rollback().catch(() => undefined);
        throw error;
      }
    },
  };
}

module.exports = { createPaymentService, quoteQuery };
