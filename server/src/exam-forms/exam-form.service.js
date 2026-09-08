const { sql } = require('../db');
const { httpError } = require('../errors');
const { formatId } = require('../customers/customer.service');
const { EXAM_FORM_STATUS, REGISTRATION_STATUS } = require('../domain/constants');

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
        if (registration.recordset[0].TrangThaiPhieu !== REGISTRATION_STATUS.PENDING_ISSUANCE) {
          throw httpError(409, 'REGISTRATION_ALREADY_ISSUED', 'Phiếu đăng ký không còn ở trạng thái chờ phát hành.');
        }

        const assignments = await transaction.request()
          .input('registrationId', sql.VarChar(20), input.registrationId)
          .input('assignments', sql.NVarChar(sql.MAX), JSON.stringify(input.assignments))
          .query(`
            WITH RequestedAssignments AS (
              SELECT candidateId, scheduleId
              FROM OPENJSON(@assignments)
              WITH (candidateId VARCHAR(20) '$.candidateId', scheduleId VARCHAR(20) '$.scheduleId')
            )
            SELECT a.candidateId, a.scheduleId, d.MaChungChi AS certificateId,
                   existing.MaPhieuDuThi AS existingExamFormId,
                   s.MaLichThi AS matchedScheduleId, s.NgayThi AS examDate,
                   s.GioThi AS examTime, s.SoChoTrong AS remainingSeats
            FROM RequestedAssignments a
            LEFT JOIN ChiTietPhieuDangKy d WITH (UPDLOCK, HOLDLOCK)
              ON d.MaPhieuDangKy = @registrationId AND d.MaThiSinh = a.candidateId
            LEFT JOIN PhieuDuThi existing WITH (UPDLOCK, HOLDLOCK)
              ON existing.MaPhieuDangKy = @registrationId AND existing.MaThiSinh = a.candidateId
            LEFT JOIN LichThi s WITH (UPDLOCK, HOLDLOCK)
              ON s.MaLichThi = a.scheduleId AND s.MaChungChi = d.MaChungChi
          `);
        if (assignments.recordset.length !== input.assignments.length || assignments.recordset.some((item) => !item.certificateId)) {
          throw httpError(400, 'ASSIGNMENTS_INCOMPLETE', 'Phải gán lịch thi cho toàn bộ thí sinh trong phiếu đăng ký.');
        }
        if (assignments.recordset.some((item) => item.existingExamFormId)) throw httpError(409, 'EXAM_FORM_ALREADY_EXISTS', 'Thí sinh đã có phiếu dự thi.');
        if (assignments.recordset.some((item) => !item.matchedScheduleId)) throw httpError(400, 'SCHEDULE_MISMATCH', 'Lịch thi không cùng loại chứng chỉ.');
        const scheduleCounts = new Map();
        assignments.recordset.forEach((item) => scheduleCounts.set(item.scheduleId, (scheduleCounts.get(item.scheduleId) || 0) + 1));
        if (assignments.recordset.some((item) => Number(item.remainingSeats) < scheduleCounts.get(item.scheduleId))) {
          throw httpError(409, 'SCHEDULE_FULL', 'Lịch thi đã hết chỗ.');
        }
        const assignmentsByCandidate = new Map(assignments.recordset.map((item) => [item.candidateId, item]));

        for (const [scheduleId, assignedCount] of scheduleCounts) {
          const capacityUpdate = await transaction.request()
            .input('scheduleId', sql.VarChar(20), scheduleId)
            .input('assignedCount', sql.Int, assignedCount)
            .query('UPDATE LichThi SET SoChoTrong = SoChoTrong - @assignedCount WHERE MaLichThi = @scheduleId AND SoChoTrong >= @assignedCount');
          if (capacityUpdate.rowsAffected?.[0] !== 1) throw httpError(409, 'SCHEDULE_FULL', 'Lịch thi đã hết chỗ.');
        }

        const issuedForms = [];
        for (const assignment of input.assignments) {
          const selectedSchedule = assignmentsByCandidate.get(assignment.candidateId);

          const examFormId = await nextExamFormId(transaction);
          await transaction.request()
            .input('examFormId', sql.VarChar(20), examFormId)
            .input('examDate', sql.Date, selectedSchedule.examDate)
            .input('examTime', sql.Time, selectedSchedule.examTime)
            .input('remainingAttempts', sql.Int, 2)
            .input('status', sql.NVarChar(50), EXAM_FORM_STATUS.PROCESSING)
            .input('candidateId', sql.VarChar(20), assignment.candidateId)
            .input('certificateId', sql.VarChar(20), selectedSchedule.certificateId)
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
          issuedForms.push({ id: examFormId, candidateId: assignment.candidateId, scheduleId: assignment.scheduleId });
        }

        await transaction.request()
          .input('registrationId', sql.VarChar(20), input.registrationId)
          .input('issuedStatus', sql.NVarChar(50), REGISTRATION_STATUS.ISSUED)
          .query('UPDATE PhieuDangKy SET TrangThaiPhieu = @issuedStatus WHERE MaPhieuDangKy = @registrationId');
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
