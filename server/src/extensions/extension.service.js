const { sql } = require('../db');
const { httpError } = require('../errors');
const { formatId } = require('../customers/customer.service');

function scheduleDateTime(date, time) {
  const dateText = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
  return new Date(`${dateText}T${String(time).slice(0, 8)}`);
}

async function nextExtensionId(transaction) {
  const result = await transaction.request().query('SELECT NEXT VALUE FOR dbo.SeqPhieuDangKyGiaHan AS value');
  return formatId('PDGH', result.recordset[0].value);
}

function createExtensionService({ db, transactionFactory, clock = () => new Date() }) {
  const makeTransaction = transactionFactory || (() => new sql.Transaction(db));
  return {
    async options(examFormId) {
      const exam = await db.request()
        .input('examFormId', sql.VarChar(20), examFormId)
        .query(`
          SELECT MaPhieuDuThi AS examFormId, MaChungChi AS certificateId
          FROM PhieuDuThi
          WHERE MaPhieuDuThi = @examFormId
        `);
      if (!exam.recordset[0]) throw httpError(404, 'EXAM_FORM_NOT_FOUND', 'Không tìm thấy phiếu dự thi.');
      const schedules = await db.request()
        .input('certificateId', sql.VarChar(20), exam.recordset[0].certificateId)
        .query(`
          SELECT MaLichThi AS scheduleId, NgayThi AS examDate, GioThi AS examTime,
                 ThoiGianThi AS duration, SoChoTrong AS remainingSeats,
                 MaChungChi AS certificateId, MaPhongThi AS roomId
          FROM LichThi
          WHERE MaChungChi = @certificateId AND SoChoTrong > 0
          ORDER BY NgayThi, GioThi, MaLichThi
        `);
      return { examFormId, schedules: schedules.recordset };
    },

    async create({ input, userId, now = clock() }) {
      const transaction = makeTransaction();
      let started = false;
      try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        started = true;
        const currentResult = await transaction.request()
          .input('examFormId', sql.VarChar(20), input.examFormId)
          .query(`
            SELECT p.MaPhieuDuThi AS examFormId, p.MaChungChi AS certificateId,
                   p.MaLichThi AS currentScheduleId, p.SoLanGiaHanConLai AS remainingAttempts,
                   l.NgayThi AS currentExamDate, l.GioThi AS currentExamTime
            FROM PhieuDuThi p WITH (UPDLOCK, HOLDLOCK)
            JOIN LichThi l ON l.MaLichThi = p.MaLichThi
            WHERE p.MaPhieuDuThi = @examFormId
          `);
        const current = currentResult.recordset[0];
        if (!current) throw httpError(404, 'EXAM_FORM_NOT_FOUND', 'Không tìm thấy phiếu dự thi.');
        if (Number(current.remainingAttempts) <= 0) {
          throw httpError(409, 'NO_EXTENSION_ATTEMPTS', 'Phiếu dự thi đã hết số lần gia hạn.');
        }

        const nextResult = await transaction.request()
          .input('scheduleId', sql.VarChar(20), input.newScheduleId)
          .query(`
            SELECT MaLichThi AS scheduleId, MaChungChi AS certificateId,
                   NgayThi AS examDate, GioThi AS examTime, SoChoTrong AS remainingSeats
            FROM LichThi WITH (UPDLOCK, HOLDLOCK)
            WHERE MaLichThi = @scheduleId
          `);
        const next = nextResult.recordset[0];
        if (!next) throw httpError(400, 'SCHEDULE_NOT_FOUND', 'Không tìm thấy lịch thi mới.');
        if (next.certificateId !== current.certificateId) {
          throw httpError(400, 'CERTIFICATE_MISMATCH', 'Lịch thi mới không cùng loại chứng chỉ.');
        }
        if (Number(next.remainingSeats) <= 0) {
          throw httpError(409, 'SCHEDULE_FULL', 'Lịch thi mới đã hết chỗ.');
        }
        const nextExamAt = scheduleDateTime(next.examDate, next.examTime);
        if (Number.isNaN(nextExamAt.getTime()) || nextExamAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
          throw httpError(409, 'EXTENSION_WINDOW_CLOSED', 'Lịch thi mới phải còn ít nhất 24 giờ.');
        }

        const extensionId = await nextExtensionId(transaction);
        const requestedAt = now.toISOString().slice(0, 10);
        await transaction.request()
          .input('extensionId', sql.VarChar(20), extensionId)
          .input('caseType', sql.NVarChar(100), input.caseType)
          .input('newScheduleId', sql.VarChar(20), input.newScheduleId)
          .input('requestedAt', sql.Date, requestedAt)
          .input('examFormId', sql.VarChar(20), input.examFormId)
          .input('userId', sql.VarChar(20), userId)
          .query(`
            INSERT INTO PhieuDangKyGiaHan
              (MaPhieuDangKyGiaHan, TruongHop, MaLichThiMoi, NgayYeuCau, MaPhieuDuThi, NguoiTao)
            VALUES
              (@extensionId, @caseType, @newScheduleId, @requestedAt, @examFormId, @userId)
          `);
        await transaction.request()
          .input('examFormId', sql.VarChar(20), input.examFormId)
          .input('scheduleId', sql.VarChar(20), input.newScheduleId)
          .query(`
            UPDATE PhieuDuThi
            SET MaLichThi = @scheduleId,
                NgayThi = (SELECT NgayThi FROM LichThi WHERE MaLichThi = @scheduleId),
                GioThi = (SELECT GioThi FROM LichThi WHERE MaLichThi = @scheduleId),
                SoLanGiaHanConLai = SoLanGiaHanConLai - 1
            WHERE MaPhieuDuThi = @examFormId
          `);
        await transaction.request()
          .input('scheduleId', sql.VarChar(20), current.currentScheduleId)
          .query('UPDATE LichThi SET SoChoTrong = SoChoTrong + 1 WHERE MaLichThi = @scheduleId');
        await transaction.request()
          .input('scheduleId', sql.VarChar(20), input.newScheduleId)
          .query('UPDATE LichThi SET SoChoTrong = SoChoTrong - 1 WHERE MaLichThi = @scheduleId');
        await transaction.commit();
        return {
          id: extensionId,
          examFormId: input.examFormId,
          caseType: input.caseType,
          newScheduleId: input.newScheduleId,
          remainingAttempts: Number(current.remainingAttempts) - 1,
        };
      } catch (error) {
        if (started) await transaction.rollback().catch(() => undefined);
        throw error;
      }
    },
  };
}

module.exports = { createExtensionService, scheduleDateTime };
