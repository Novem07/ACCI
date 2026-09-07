const { sql } = require('../db');
const { httpError } = require('../errors');
const { formatId } = require('../customers/customer.service');

async function nextExamFormId(transaction) {
  const result = await transaction.request().query('SELECT NEXT VALUE FOR dbo.SeqPhieuDuThi AS value');
  return formatId('PDT', result.recordset[0].value);
}

function createExamFormService({ db, transactionFactory }) {
  const makeTransaction = transactionFactory || (() => new sql.Transaction(db));
  return {
    async create({ input, userId }) {
      const transaction = makeTransaction();
      let started = false;
      try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        started = true;
        const registration = await transaction.request()
          .input('registrationId', sql.VarChar(20), input.registrationId)
          .query(`
            SELECT MaPhieuDangKy, TrangThaiPhieu
            FROM PhieuDangKy WITH (UPDLOCK, HOLDLOCK)
            WHERE MaPhieuDangKy = @registrationId
          `);
        if (!registration.recordset[0]) throw httpError(404, 'REGISTRATION_NOT_FOUND', 'Không tìm thấy phiếu đăng ký.');
        if (registration.recordset[0].TrangThaiPhieu !== 'Chờ phát hành') {
          throw httpError(409, 'REGISTRATION_ALREADY_ISSUED', 'Phiếu đăng ký không còn ở trạng thái chờ phát hành.');
        }

        const issuedForms = [];
        for (const assignment of input.assignments) {
          const detail = await transaction.request()
            .input('registrationId', sql.VarChar(20), input.registrationId)
            .input('candidateId', sql.VarChar(20), assignment.candidateId)
            .query(`
              SELECT MaThiSinh AS candidateId, MaChungChi AS certificateId
              FROM ChiTietPhieuDangKy
              WHERE MaPhieuDangKy = @registrationId AND MaThiSinh = @candidateId
            `);
          if (!detail.recordset[0]) throw httpError(400, 'CANDIDATE_NOT_IN_REGISTRATION', 'Thí sinh không thuộc phiếu đăng ký.');

          const duplicate = await transaction.request()
            .input('registrationId', sql.VarChar(20), input.registrationId)
            .input('candidateId', sql.VarChar(20), assignment.candidateId)
            .query(`
              SELECT TOP 1 MaPhieuDuThi
              FROM PhieuDuThi WITH (UPDLOCK, HOLDLOCK)
              WHERE MaPhieuDangKy = @registrationId AND MaThiSinh = @candidateId
            `);
          if (duplicate.recordset[0]) throw httpError(409, 'EXAM_FORM_ALREADY_EXISTS', 'Thí sinh đã có phiếu dự thi.');

          const schedule = await transaction.request()
            .input('scheduleId', sql.VarChar(20), assignment.scheduleId)
            .input('certificateId', sql.VarChar(20), detail.recordset[0].certificateId)
            .query(`
              SELECT MaLichThi AS scheduleId, MaChungChi AS certificateId,
                     NgayThi AS examDate, GioThi AS examTime, SoChoTrong AS remainingSeats
              FROM LichThi WITH (UPDLOCK, HOLDLOCK)
              WHERE MaLichThi = @scheduleId AND MaChungChi = @certificateId
            `);
          const selectedSchedule = schedule.recordset[0];
          if (!selectedSchedule) throw httpError(400, 'SCHEDULE_MISMATCH', 'Lịch thi không cùng loại chứng chỉ.');
          if (Number(selectedSchedule.remainingSeats) <= 0) throw httpError(409, 'SCHEDULE_FULL', 'Lịch thi đã hết chỗ.');

          const examFormId = await nextExamFormId(transaction);
          await transaction.request()
            .input('examFormId', sql.VarChar(20), examFormId)
            .input('examDate', sql.Date, selectedSchedule.examDate)
            .input('examTime', sql.Time, selectedSchedule.examTime)
            .input('remainingAttempts', sql.Int, 2)
            .input('status', sql.NVarChar(50), 'Đang xử lý')
            .input('candidateId', sql.VarChar(20), assignment.candidateId)
            .input('certificateId', sql.VarChar(20), detail.recordset[0].certificateId)
            .input('registrationId', sql.VarChar(20), input.registrationId)
            .input('userId', sql.VarChar(20), userId)
            .input('scheduleId', sql.VarChar(20), assignment.scheduleId)
            .query(`
              INSERT INTO PhieuDuThi
                (MaPhieuDuThi, NgayThi, GioThi, SoLanGiaHanConLai, TrangThaiPhieu,
                 MaThiSinh, MaChungChi, MaPhieuDangKy, NguoiTao, MaLichThi)
              VALUES
                (@examFormId, @examDate, @examTime, @remainingAttempts, @status,
                 @candidateId, @certificateId, @registrationId, @userId, @scheduleId)
            `);
          await transaction.request()
            .input('scheduleId', sql.VarChar(20), assignment.scheduleId)
            .query('UPDATE LichThi SET SoChoTrong = SoChoTrong - 1 WHERE MaLichThi = @scheduleId');
          issuedForms.push({ id: examFormId, candidateId: assignment.candidateId, scheduleId: assignment.scheduleId });
        }

        await transaction.request()
          .input('registrationId', sql.VarChar(20), input.registrationId)
          .query("UPDATE PhieuDangKy SET TrangThaiPhieu = N'Đã phát hành' WHERE MaPhieuDangKy = @registrationId");
        await transaction.commit();
        return { registrationId: input.registrationId, forms: issuedForms };
      } catch (error) {
        if (started) await transaction.rollback().catch(() => undefined);
        throw error;
      }
    },

    async list({ page = 1, pageSize = 20, query = '' }) {
      const offset = (page - 1) * pageSize;
      const search = query ? `%${query}%` : null;
      const countResult = await db.request()
        .input('query', sql.VarChar(50), search)
        .query(`
          SELECT COUNT_BIG(*) AS totalItems
          FROM PhieuDuThi p
          WHERE @query IS NULL OR p.MaPhieuDuThi LIKE @query OR p.MaThiSinh LIKE @query
        `);
      const result = await db.request()
        .input('query', sql.VarChar(50), search)
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize)
        .query(`
          SELECT p.MaPhieuDuThi AS examFormId, p.MaThiSinh AS candidateId,
                 p.MaChungChi AS certificateId, c.TenChungChi AS certificateName,
                 p.MaPhieuDangKy AS registrationId, p.MaLichThi AS scheduleId,
                 p.NgayThi AS examDate, p.GioThi AS examTime,
                 p.SoLanGiaHanConLai AS remainingAttempts, p.TrangThaiPhieu AS status
          FROM PhieuDuThi p
          JOIN ChungChi c ON c.MaChungChi = p.MaChungChi
          WHERE @query IS NULL OR p.MaPhieuDuThi LIKE @query OR p.MaThiSinh LIKE @query
          ORDER BY p.NgayThi, p.GioThi, p.MaPhieuDuThi
          OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
        `);
      const totalItems = Number(countResult.recordset[0].totalItems);
      return { items: result.recordset, page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
    },

    async get(examFormId) {
      const result = await db.request()
        .input('examFormId', sql.VarChar(20), examFormId)
        .query(`
          SELECT p.MaPhieuDuThi AS examFormId, p.MaThiSinh AS candidateId,
                 ts.HoTen AS candidateName, ts.CCCD AS citizenId,
                 ts.SDT AS phone, ts.Email AS email, ts.DiaChi AS address,
                 p.MaChungChi AS certificateId, c.TenChungChi AS certificateName,
                 p.MaPhieuDangKy AS registrationId, p.MaLichThi AS scheduleId,
                 p.NgayThi AS examDate, p.GioThi AS examTime,
                 p.SoLanGiaHanConLai AS remainingAttempts, p.TrangThaiPhieu AS status
          FROM PhieuDuThi p
          JOIN ThiSinh ts ON ts.MaThiSinh = p.MaThiSinh
          JOIN ChungChi c ON c.MaChungChi = p.MaChungChi
          WHERE p.MaPhieuDuThi = @examFormId
        `);
      if (!result.recordset[0]) throw httpError(404, 'EXAM_FORM_NOT_FOUND', 'Không tìm thấy phiếu dự thi.');
      return result.recordset[0];
    },
  };
}

module.exports = { createExamFormService };
