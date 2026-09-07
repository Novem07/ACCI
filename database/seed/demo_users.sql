-- Run with sqlcmd variables DatabaseName and DemoPasswordHash.
USE [$(DatabaseName)];
GO

DECLARE @passwordHash VARCHAR(60) = '$(DemoPasswordHash)';

MERGE dbo.NhanVien AS target
USING (VALUES
    ('NV001', N'Nguyễn Văn A', '0901234567', 'nva@example.com', N'Tiếp nhận'),
    ('NV002', N'Trần Thị B', '0902345678', 'ttb@example.com', N'Kế Toán'),
    ('NV003', N'Lê Văn C', '0903456789', 'lvc@example.com', N'Tổ chức thi'),
    ('NV004', N'Phạm Thị D', '0904567890', 'ptd@example.com', N'Nhập liệu'),
    ('NV005', N'Hoàng Văn E', '0905678901', 'hve@example.com', N'Coi thi')
) AS source (MaNhanVien, HoTen, SDT, Email, VaiTro)
ON target.MaNhanVien = source.MaNhanVien
WHEN MATCHED THEN
    UPDATE SET HoTen = source.HoTen, SDT = source.SDT, Email = source.Email,
               VaiTro = source.VaiTro, MatKhauHash = @passwordHash
WHEN NOT MATCHED THEN
    INSERT (MaNhanVien, HoTen, SDT, Email, VaiTro, MatKhauHash)
    VALUES (source.MaNhanVien, source.HoTen, source.SDT, source.Email, source.VaiTro, @passwordHash);
GO
