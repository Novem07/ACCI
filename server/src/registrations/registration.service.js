const { sql } = require('../db');
const { httpError } = require('../errors');
const { formatId } = require('../customers/customer.service');

async function nextTransactionId(transaction, sequenceName, prefix) {
  const result = await transaction.request().query(`SELECT NEXT VALUE FOR dbo.${sequenceName} AS value`);
  return formatId(prefix, result.recordset[0].value);
}

function createRegistrationService({ db, transactionFactory }) {
  const makeTransaction = transactionFactory || (() => new sql.Transaction(db));

  return {
    async create({ input, userId }) {
      const transaction = makeTransaction();
      let started = false;
      try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        started = true;

        const customer = await transaction.request()
          .input('customerId', sql.VarChar(20), input.customerId)
          .query('SELECT MaKhachHang FROM KhachHang WITH (UPDLOCK, HOLDLOCK) WHERE MaKhachHang = @customerId');
        if (!customer.recordset[0]) {
          throw httpError(404, 'CUSTOMER_NOT_FOUND', 'Không tìm thấy khách hàng.');
        }

        const registrationId = await nextTransactionId(transaction, 'SeqPhieuDangKy', 'PDK');
        await transaction.request()
          .input('registrationId', sql.VarChar(20), registrationId)
          .input('registrationDate', sql.Date, input.registrationDate)
          .input('customerId', sql.VarChar(20), input.customerId)
          .input('userId', sql.VarChar(20), userId)
          .query(`
            INSERT INTO PhieuDangKy (MaPhieuDangKy, NgayDangKy, TrangThaiPhieu, MaKhachHang, NguoiTao)
            VALUES (@registrationId, @registrationDate, N'Chờ phát hành', @customerId, @userId)
          `);

        const candidateIds = [];
        for (const candidate of input.candidates) {
          const certificate = await transaction.request()
            .input('certificateId', sql.VarChar(20), candidate.certificateId)
            .query('SELECT MaChungChi FROM ChungChi WHERE MaChungChi = @certificateId');
          if (!certificate.recordset[0]) {
            throw httpError(400, 'CERTIFICATE_NOT_FOUND', `Không tìm thấy chứng chỉ ${candidate.certificateId}.`);
          }

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
          registrationDate: input.registrationDate,
        };
      } catch (error) {
        if (started) await transaction.rollback().catch(() => undefined);
        throw error;
      }
    },

    async list() {
      const result = await db.request().query(`
        SELECT p.MaPhieuDangKy AS id, p.NgayDangKy AS registrationDate,
               p.TrangThaiPhieu AS status, p.MaKhachHang AS customerId,
               p.NguoiTao AS createdBy, COUNT(c.MaThiSinh) AS candidateCount
        FROM PhieuDangKy p
        LEFT JOIN ChiTietPhieuDangKy c ON c.MaPhieuDangKy = p.MaPhieuDangKy
        GROUP BY p.MaPhieuDangKy, p.NgayDangKy, p.TrangThaiPhieu, p.MaKhachHang, p.NguoiTao
        ORDER BY p.NgayDangKy DESC, p.MaPhieuDangKy DESC
      `);
      return result.recordset;
    },
  };
}

module.exports = { createRegistrationService, nextTransactionId };
