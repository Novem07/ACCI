const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// GET các lịch thi phù hợp để gia hạn
router.get('/giahan/:maPhieu', async (req, res) => {
    const { maPhieu } = req.params;

    try {
        const pool = await poolPromise;

        // Lấy MaChungChi từ phiếu dự thi
        const result = await pool.request()
            .input('maPhieu', sql.VarChar, maPhieu)
            .query(`
        SELECT MaChungChi 
        FROM PhieuDuThi 
        WHERE MaPhieuDuThi = @maPhieu
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phiếu dự thi' });
        }

        const maChungChi = result.recordset[0].MaChungChi;

        // Lấy các lịch thi phù hợp
        const lichThi = await pool.request()
            .input('maChungChi', sql.VarChar, maChungChi)
            .query(`
                SELECT 
                MaLichThi,
                CONVERT(varchar(10), NgayThi, 120) AS NgayThi,
                CONVERT(varchar(8), GioThi, 108) AS GioThi,
                ThoiGianThi,
                SoChoTrong,
                MaChungChi,
                MaPhongThi
                FROM LichThi
                WHERE MaChungChi = @maChungChi AND SoChoTrong > 0
            `);

        res.json(lichThi.recordset);
    } catch (err) {
        console.error('Lỗi khi lấy lịch thi gia hạn:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy lịch thi phù hợp' });
    }
});

module.exports = router;
