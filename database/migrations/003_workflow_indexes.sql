USE [$(DatabaseName)];
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF EXISTS (
  SELECT 1 FROM dbo.PhieuDuThi
  GROUP BY MaPhieuDangKy, MaThiSinh
  HAVING COUNT(*) > 1
) THROW 51010, 'Cannot create UX_PhieuDuThi_Registration_Candidate: duplicate exam forms exist.', 1;

IF EXISTS (
  SELECT 1 FROM dbo.HoaDonDangKy
  GROUP BY MaPhieuDangKy
  HAVING COUNT(*) > 1
) THROW 51011, 'Cannot create UX_HoaDonDangKy_Registration: duplicate invoices exist.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.PhieuDuThi') AND name = N'UX_PhieuDuThi_Registration_Candidate')
  CREATE UNIQUE INDEX UX_PhieuDuThi_Registration_Candidate ON dbo.PhieuDuThi (MaPhieuDangKy, MaThiSinh);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.HoaDonDangKy') AND name = N'UX_HoaDonDangKy_Registration')
  CREATE UNIQUE INDEX UX_HoaDonDangKy_Registration ON dbo.HoaDonDangKy (MaPhieuDangKy);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.LichThi') AND name = N'IX_LichThi_Certificate_Date')
  CREATE INDEX IX_LichThi_Certificate_Date ON dbo.LichThi (MaChungChi, NgayThi, GioThi) INCLUDE (SoChoTrong, MaPhongThi);

COMMIT TRANSACTION;
GO
