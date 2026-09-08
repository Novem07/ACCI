const { sql } = require('../db');
const { httpError } = require('../errors');
const { formatId } = require('../customers/customer.service');
const { toBusinessDate } = require('../domain/date');

async function checkoutQuery(target, registrationId) {
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
             COALESCE(SUM(CAST(cc.Gia AS DECIMAL(12,2))), 0) AS baseAmount,
             hd.MaHoaDon AS invoiceId,
             hd.TongTien AS totalAmount,
             hd.PhuongThucThanhToan AS paymentMethod,
             hd.NgayLapHoaDon AS invoiceDate,
             hd.TrangThaiThanhToan AS paymentStatus
      FROM PhieuDangKy p
      JOIN KhachHang kh ON kh.MaKhachHang = p.MaKhachHang
      LEFT JOIN ChiTietPhieuDangKy ct ON ct.MaPhieuDangKy = p.MaPhieuDangKy
      LEFT JOIN ChungChi cc ON cc.MaChungChi = ct.MaChungChi
      LEFT JOIN HoaDonDangKy hd ON hd.MaPhieuDangKy = p.MaPhieuDangKy
      WHERE p.MaPhieuDangKy = @registrationId
      GROUP BY p.MaPhieuDangKy, p.MaKhachHang, p.NgayDangKy,
               p.TrangThaiPhieu, kh.HoTen, kh.SDT, kh.DonVi,
               hd.MaHoaDon, hd.TongTien, hd.PhuongThucThanhToan, hd.NgayLapHoaDon, hd.TrangThaiThanhToan
    `);
  const row = result.recordset[0];
  if (!row) throw httpError(404, 'REGISTRATION_NOT_FOUND', 'Không tìm thấy phiếu đăng ký.');

  const candidateCount = Number(row.candidateCount);
  const baseAmount = Math.round(Number(row.baseAmount));
  const isOrganization = row.organization !== 'Không';
  const discountRate = isOrganization ? (candidateCount > 20 ? 0.15 : 0.10) : 0;
  const discountAmount = Math.round(baseAmount * discountRate);
  const quote = {
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
  return {
    payment: {
      registrationId: row.registrationId,
      customerId: row.customerId,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      organization: row.organization,
      registrationDate: row.registrationDate,
      registrationStatus: row.registrationStatus,
      invoiceId: row.invoiceId || null,
      totalAmount: row.totalAmount === null || row.totalAmount === undefined ? null : Math.round(Number(row.totalAmount)),
      paymentMethod: row.paymentMethod || null,
      invoiceDate: row.invoiceDate || null,
      paymentStatus: row.paymentStatus || null,
      status: row.invoiceId ? 'paid' : 'unpaid',
    },
    quote,
  };
}

async function quoteQuery(target, registrationId) {
  return (await checkoutQuery(target, registrationId)).quote;
}

async function nextInvoiceId(target) {
  const result = await target.request().query('SELECT NEXT VALUE FOR dbo.SeqHoaDonDangKy AS value');
  return formatId('HD', result.recordset[0].value);
}

function createPaymentService({ db, transactionFactory, clock = () => new Date() }) {
  const makeTransaction = transactionFactory || (() => new sql.Transaction(db));
  return {
    async list({ page, pageSize, query, status }) {
      const offset = (page - 1) * pageSize;
      const search = `%${query.replace(/[\\%_\[]/g, '\\$&')}%`;
      const bindFilters = (request) => request
        .input('query', sql.NVarChar(100), query)
        .input('search', sql.NVarChar(202), search)
        .input('status', sql.VarChar(10), status);
      const whereClause = `
        WHERE (@query = N'' OR p.MaPhieuDangKy LIKE @search ESCAPE '\\'
          OR p.MaKhachHang LIKE @search ESCAPE '\\' OR kh.HoTen LIKE @search ESCAPE '\\')
          AND (@status = ''
            OR (@status = 'paid' AND EXISTS (SELECT 1 FROM HoaDonDangKy hd WHERE hd.MaPhieuDangKy = p.MaPhieuDangKy))
            OR (@status = 'unpaid' AND NOT EXISTS (SELECT 1 FROM HoaDonDangKy hd WHERE hd.MaPhieuDangKy = p.MaPhieuDangKy)))
      `;
      const countResult = await bindFilters(db.request()).query(`
        SELECT COUNT_BIG(*) AS totalItems
        FROM PhieuDangKy p
        JOIN KhachHang kh ON kh.MaKhachHang = p.MaKhachHang
        ${whereClause}
      `);
      const totalItems = Number(countResult.recordset[0].totalItems);
      const result = await bindFilters(db.request())
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize)
        .query(`
        SELECT p.MaPhieuDangKy AS registrationId,
               p.MaKhachHang AS customerId,
               p.MaThanhToan AS invoiceId,
               p.NgayDangKy AS registrationDate,
               p.TrangThaiPhieu AS registrationStatus,
               kh.HoTen AS customerName,
               kh.DonVi AS organization,
               CASE WHEN EXISTS (SELECT 1 FROM HoaDonDangKy hd WHERE hd.MaPhieuDangKy = p.MaPhieuDangKy)
                 THEN 'paid' ELSE 'unpaid' END AS status
        FROM PhieuDangKy p
        JOIN KhachHang kh ON kh.MaKhachHang = p.MaKhachHang
        ${whereClause}
        ORDER BY p.NgayDangKy DESC, p.MaPhieuDangKy DESC
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

    async get(registrationId) {
      return (await checkoutQuery(db, registrationId)).payment;
    },

    async quote(registrationId) {
      return quoteQuery(db, registrationId);
    },

    async getCheckout(registrationId) {
      return checkoutQuery(db, registrationId);
    },

    async createInvoice({ registrationId, input, userId }) {
      const transaction = makeTransaction();
      let started = false;
      try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        started = true;
        const { quote } = await checkoutQuery(transaction, registrationId);
        const latestInvoiceDate = toBusinessDate(clock());
        if (input.invoiceDate < quote.registrationDate || input.invoiceDate > latestInvoiceDate) {
          throw httpError(400, 'INVOICE_DATE_OUT_OF_RANGE', 'Ngày lập hóa đơn phải nằm trong khoảng từ ngày đăng ký đến hôm nay.');
        }
        const existing = await transaction.request()
          .input('registrationId', sql.VarChar(20), registrationId)
          .query('SELECT TOP 1 MaHoaDon FROM HoaDonDangKy WITH (UPDLOCK, HOLDLOCK) WHERE MaPhieuDangKy = @registrationId');
        if (existing.recordset[0]) {
          throw httpError(409, 'INVOICE_ALREADY_EXISTS', 'Phiếu đăng ký đã có hóa đơn.');
        }

        const invoiceId = await nextInvoiceId(transaction);
        const invoiceDate = input.invoiceDate;
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

module.exports = { createPaymentService, quoteQuery, checkoutQuery };
