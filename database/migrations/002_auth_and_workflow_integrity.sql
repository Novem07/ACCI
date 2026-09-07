:setvar DatabaseName ACCI_CI_SMOKE
USE [$(DatabaseName)];
GO

IF COL_LENGTH(N'dbo.NhanVien', N'MatKhauHash') IS NULL
BEGIN
    ALTER TABLE dbo.NhanVien ADD MatKhauHash VARCHAR(60) NULL;
END;
GO

IF COL_LENGTH(N'dbo.KhachHang', N'HoTen') IS NULL
BEGIN
    ALTER TABLE dbo.KhachHang ADD HoTen NVARCHAR(100) NULL, CCCD VARCHAR(20) NULL;
END;
GO

IF COL_LENGTH(N'dbo.ThiSinh', N'HoTen') IS NULL
BEGIN
    ALTER TABLE dbo.ThiSinh ADD HoTen NVARCHAR(100) NULL, CCCD VARCHAR(20) NULL;
END;
GO

IF COL_LENGTH(N'dbo.PhieuDangKyGiaHan', N'MaLichThiMoi') IS NULL
BEGIN
    ALTER TABLE dbo.PhieuDangKyGiaHan ADD MaLichThiMoi VARCHAR(20) NULL;
END;
GO

IF OBJECT_ID(N'dbo.ChiTietPhieuDangKy', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChiTietPhieuDangKy (
        MaPhieuDangKy VARCHAR(20) NOT NULL,
        MaThiSinh VARCHAR(20) NOT NULL,
        MaChungChi VARCHAR(20) NOT NULL,
        CONSTRAINT PK_ChiTietPhieuDangKy PRIMARY KEY (MaPhieuDangKy, MaThiSinh),
        FOREIGN KEY (MaPhieuDangKy) REFERENCES dbo.PhieuDangKy(MaPhieuDangKy),
        FOREIGN KEY (MaThiSinh) REFERENCES dbo.ThiSinh(MaThiSinh),
        FOREIGN KEY (MaChungChi) REFERENCES dbo.ChungChi(MaChungChi)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PDKGH_LichThiMoi')
BEGIN
    ALTER TABLE dbo.PhieuDangKyGiaHan ADD CONSTRAINT FK_PDKGH_LichThiMoi
        FOREIGN KEY (MaLichThiMoi) REFERENCES dbo.LichThi(MaLichThi);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PhieuDuThi_SoLanGiaHanConLai')
BEGIN
    ALTER TABLE dbo.PhieuDuThi ADD CONSTRAINT CK_PhieuDuThi_SoLanGiaHanConLai
        CHECK (SoLanGiaHanConLai BETWEEN 0 AND 2);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'SeqKhachHang')
    EXEC(N'CREATE SEQUENCE dbo.SeqKhachHang AS BIGINT START WITH 1 INCREMENT BY 1');
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'SeqThiSinh')
    EXEC(N'CREATE SEQUENCE dbo.SeqThiSinh AS BIGINT START WITH 1 INCREMENT BY 1');
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'SeqPhieuDangKy')
    EXEC(N'CREATE SEQUENCE dbo.SeqPhieuDangKy AS BIGINT START WITH 1 INCREMENT BY 1');
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'SeqPhieuDuThi')
    EXEC(N'CREATE SEQUENCE dbo.SeqPhieuDuThi AS BIGINT START WITH 1 INCREMENT BY 1');
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'SeqPhieuDangKyGiaHan')
    EXEC(N'CREATE SEQUENCE dbo.SeqPhieuDangKyGiaHan AS BIGINT START WITH 1 INCREMENT BY 1');
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'SeqHoaDonDangKy')
    EXEC(N'CREATE SEQUENCE dbo.SeqHoaDonDangKy AS BIGINT START WITH 1 INCREMENT BY 1');
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_PhieuDangKyGiaHan_PhieuDuThi')
BEGIN
    CREATE UNIQUE INDEX UX_PhieuDangKyGiaHan_PhieuDuThi
        ON dbo.PhieuDangKyGiaHan (MaPhieuDuThi, MaLichThiMoi);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PhieuDangKy_NgayDangKy')
    CREATE INDEX IX_PhieuDangKy_NgayDangKy ON dbo.PhieuDangKy (NgayDangKy DESC) INCLUDE (MaKhachHang, TrangThaiPhieu);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PhieuDuThi_MaPhieuDangKy')
    CREATE INDEX IX_PhieuDuThi_MaPhieuDangKy ON dbo.PhieuDuThi (MaPhieuDangKy) INCLUDE (MaThiSinh, MaChungChi, MaLichThi, TrangThaiPhieu);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChiTietPDK_MaThiSinh')
    CREATE INDEX IX_ChiTietPDK_MaThiSinh ON dbo.ChiTietPhieuDangKy (MaThiSinh) INCLUDE (MaPhieuDangKy, MaChungChi);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_LichThi_ChungChiNgayThi')
    CREATE INDEX IX_LichThi_ChungChiNgayThi ON dbo.LichThi (MaChungChi, NgayThi, GioThi) INCLUDE (SoChoTrong);
GO
