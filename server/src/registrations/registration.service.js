const { sql } = require('../db');
const { httpError } = require('../errors');
const { formatId } = require('../customers/customer.service');
const { toBusinessDate } = require('../domain/date');

async function nextTransactionId(transaction, sequenceName, prefix) {
  const result = await transaction.request().query(`SELECT NEXT VALUE FOR dbo.${sequenceName} AS value`);
  return formatId(prefix, result.recordset[0].value);
}

function createRegistrationService({ db, transactionFactory }) {
  const makeTransaction = transactionFactory || (() => new sql.Transaction(db));

  return {
    async create({ input, userId, now = new Date() }) {
      const transaction = makeTransaction();
      let started = false;
      try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        started = true;
        const registrationDate = toBusinessDate(now);

        const customer = await transaction.request()
          .input('customerId', sql.VarChar(20), input.customerId)
          .query('SELECT MaKhachHang FROM KhachHang WITH (UPDLOCK, HOLDLOCK) WHERE MaKhachHang = @customerId');
        if (!customer.recordset[0]) {
          throw httpError(404, 'CUSTOMER_NOT_FOUND', 'Không tìm thấy khách hàng.');
        }

        const certificateIds = [...new Set(input.candidates.map(({ certificateId }) => certificateId))];
        const certificates = await transaction.request()
          .input('certificateIds', sql.NVarChar(sql.MAX), JSON.stringify(certificateIds))
          .query(`
            SELECT MaChungChi AS id
            FROM ChungChi
            WHERE MaChungChi IN (SELECT [value] FROM OPENJSON(@certificateIds))
          `);
        const knownCertificateIds = new Set(certificates.recordset.map(({ id }) => id));
        const missingCertificateIds = certificateIds.filter((certificateId) => !knownCertificateIds.has(certificateId));
        if (missingCertificateIds.length > 0) {
          throw httpError(400, 'CERTIFICATE_NOT_FOUND', `Không tìm thấy chứng chỉ ${missingCertificateIds.join(', ')}.`);
        }

        const registrationId = await nextTransactionId(transaction, 'SeqPhieuDangKy', 'PDK');
        await transaction.request()
          .input('registrationId', sql.VarChar(20), registrationId)
          .input('registrationDate', sql.Date, registrationDate)
          .input('customerId', sql.VarChar(20), input.customerId)
          .input('userId', sql.VarChar(20), userId)
          .query(`
            INSERT INTO PhieuDangKy (MaPhieuDangKy, NgayDangKy, TrangThaiPhieu, MaKhachHang, NguoiTao)
            VALUES (@registrationId, @registrationDate, N'Chờ phát hành', @customerId, @userId)
          `);

        const candidateIds = [];
        for (const candidate of input.candidates) {
          const candidateId = await nextTransactionId(transaction, 'SeqThiSinh', 'TS');
          await transaction.request()
            .input('candidateId', sql.VarChar(20), candidateId)
            .input('fullName', sql.NVarChar(100), candidate.fullName)
            .input('citizenId', sql.VarChar(20), candidate.citizenId)
            .input('phone', sql.VarChar(15), candidate.phone)
            .input('email', sql.VarChar(100), candidate.email)
            .input('address', sql.NVarChar(200), candidate.address)
            .input('customerId', sql.VarChar(20), input.customerId)
            .query(`
              INSERT INTO ThiSinh (MaThiSinh, HoTen, CCCD, SDT, Email, DiaChi, MaKhachHang)
              VALUES (@candidateId, @fullName, @citizenId, @phone, @email, @address, @customerId)
            `);

          await transaction.request()
            .input('registrationId', sql.VarChar(20), registrationId)
            .input('candidateId', sql.VarChar(20), candidateId)
            .input('certificateId', sql.VarChar(20), candidate.certificateId)
            .query(`
              INSERT INTO ChiTietPhieuDangKy (MaPhieuDangKy, MaThiSinh, MaChungChi)
              VALUES (@registrationId, @candidateId, @certificateId)
            `);
          candidateIds.push(candidateId);
        }

        await transaction.commit();
        return {
          id: registrationId,
          customerId: input.customerId,
          status: 'Chờ phát hành',
          candidateCount: candidateIds.length,
          candidateIds,
          createdBy: userId,
          registrationDate,
        };
      } catch (error) {
        if (started) await transaction.rollback().catch(() => undefined);
        throw error;
      }
    },

    async list({ page, pageSize, query, status }) {
      const offset = (page - 1) * pageSize;
      const search = `%${query.replace(/[\\%_\[]/g, '\\$&')}%`;
      const bindFilters = (request) => request
        .input('query', sql.NVarChar(100), query)
        .input('search', sql.NVarChar(202), search)
        .input('status', sql.NVarChar(50), status);
      const whereClause = `
        WHERE (@query = N'' OR p.MaPhieuDangKy LIKE @search ESCAPE '\\'
          OR p.MaKhachHang LIKE @search ESCAPE '\\')
          AND (@status = N'' OR p.TrangThaiPhieu = @status)
      `;
      const countResult = await bindFilters(db.request()).query(`
        SELECT COUNT_BIG(*) AS totalItems
        FROM PhieuDangKy p
        ${whereClause}
      `);
      const totalItems = Number(countResult.recordset[0].totalItems);
      const result = await bindFilters(db.request())
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize)
        .query(`
        SELECT p.MaPhieuDangKy AS id, p.NgayDangKy AS registrationDate,
               p.TrangThaiPhieu AS status, p.MaKhachHang AS customerId,
               p.NguoiTao AS createdBy, COUNT(c.MaThiSinh) AS candidateCount
        FROM PhieuDangKy p
        LEFT JOIN ChiTietPhieuDangKy c ON c.MaPhieuDangKy = p.MaPhieuDangKy
        ${whereClause}
        GROUP BY p.MaPhieuDangKy, p.NgayDangKy, p.TrangThaiPhieu, p.MaKhachHang, p.NguoiTao
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
  };
}

module.exports = { createRegistrationService, nextTransactionId };
