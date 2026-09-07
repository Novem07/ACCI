-- Use the database
USE ACCI_DB;
GO

-- Xoá tất cả trigger nếu đã tồn tại
DROP TRIGGER IF EXISTS trg_check_and_insert_phieuduthi;
DROP TRIGGER IF EXISTS trg_check_and_insert_coithi;
DROP TRIGGER IF EXISTS trg_tinh_tro_gia;
DROP TRIGGER IF EXISTS trg_tinh_tongtien_giahan;
DROP TRIGGER IF EXISTS trg_check_role_ketoan_pg;
DROP TRIGGER IF EXISTS trg_check_role_tiepnhan_lichthi;
DROP TRIGGER IF EXISTS trg_check_role_tiepnhan_dk;
DROP TRIGGER IF EXISTS trg_check_insert_saisot;
DROP TRIGGER IF EXISTS trg_check_insert_dkgiahan
DROP TRIGGER IF EXISTS trg_check_machungchi_donvi;
DROP TRIGGER IF EXISTS trg_check_lichthi_10_thisinh;
DROP TRIGGER IF EXISTS trg_check_solan_vs_sophieu_dkgiahan;
GO

-- Trigger: Gộp kiểm tra vai trò khi thêm phiếu dự thi
-- Trigger: Gộp kiểm tra vai trò và trạng thái phiếu khi thêm phiếu dự thi (KHÔNG kiểm tra số lần gia hạn còn lại và KHÔNG kiểm tra chỗ trống)
CREATE TRIGGER trg_check_and_insert_phieuduthi
ON PhieuDuThi
INSTEAD OF INSERT
AS
BEGIN
    -- Chỉ nhân viên tổ chức thi mới được phép tạo
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN NhanVien nv ON i.NguoiTao = nv.MaNhanVien
        WHERE nv.VaiTro != N'Tổ chức thi'
    )
    BEGIN
        RAISERROR(N'Chỉ nhân viên tổ chức thi mới được tạo phiếu dự thi.', 16, 1);
        RETURN;
    END;

    -- Chỉ tạo phiếu dự thi từ phiếu đăng ký có trạng thái Chờ phát hành
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN PhieuDangKy pdk ON i.MaPhieuDangKy = pdk.MaPhieuDangKy
        WHERE pdk.TrangThaiPhieu != N'Chờ phát hành'
    )
    BEGIN
        RAISERROR(N'Chỉ được tạo phiếu dự thi từ phiếu đăng ký đang ở trạng thái Chờ phát hành.', 16, 1);
        RETURN;
    END;

    -- Insert bình thường
    INSERT INTO PhieuDuThi SELECT * FROM inserted;
END;
GO

-- Trigger: Gộp kiểm tra vai trò + hợp lệ khi thêm ChiTietCoiThi
CREATE TRIGGER trg_check_and_insert_coithi
ON ChiTietCoiThi
INSTEAD OF INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN NhanVien nv ON i.MaNhanVien = nv.MaNhanVien
        WHERE i.VaiTro NOT IN (N'Giám thị chính', N'Giám thị phụ', N'Giám sát hành lang')
           OR nv.VaiTro != N'Coi thi'
    )
    BEGIN
        RAISERROR(N'Chỉ nhân viên vai trò Coi thi và vai trò phù hợp mới được gán vào phòng thi.', 16, 1);
        RETURN;
    END;

    MERGE ChiTietCoiThi AS target
    USING inserted AS source
    ON target.MaPhongThi = source.MaPhongThi AND target.MaNhanVien = source.MaNhanVien
    WHEN MATCHED THEN
        UPDATE SET VaiTro = source.VaiTro
    WHEN NOT MATCHED THEN
        INSERT (MaPhongThi, MaNhanVien, VaiTro)
        VALUES (source.MaPhongThi, source.MaNhanVien, source.VaiTro);
END;
GO

-- Trigger: Tính tro giá và tổng tiền cho Hóa đơn đăng ký
CREATE TRIGGER trg_tinh_tro_gia
ON HoaDonDangKy
INSTEAD OF INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN NhanVien nv ON i.NguoiTao = nv.MaNhanVien
        WHERE nv.VaiTro != N'Kế Toán'
    )
    BEGIN
        RAISERROR(N'Chỉ nhân viên kế toán mới được tạo hóa đơn đăng ký.', 16, 1);
        RETURN;
    END;

    INSERT INTO HoaDonDangKy (
        MaHoaDon, MaPhieuDangKy, Gia, SoLuongThiSinh, TroGia,
        TongTien, NgayLapHoaDon, PhuongThucThanhToan, TrangThaiThanhToan, NguoiTao
    )
    SELECT 
        i.MaHoaDon, i.MaPhieuDangKy, i.Gia, i.SoLuongThiSinh,
        CASE 
            WHEN KH.DonVi = 'Không' THEN 0
            WHEN i.SoLuongThiSinh > 20 THEN ROUND(i.Gia * 0.15, 2)
            ELSE ROUND(i.Gia * 0.10, 2)
        END,
        (i.Gia - 
         CASE 
            WHEN KH.DonVi = 'Không' THEN 0
            WHEN i.SoLuongThiSinh > 20 THEN ROUND(i.Gia * 0.15, 2)
            ELSE ROUND(i.Gia * 0.10, 2)
         END) * i.SoLuongThiSinh,
        i.NgayLapHoaDon, i.PhuongThucThanhToan, i.TrangThaiThanhToan, i.NguoiTao
    FROM inserted i
    JOIN PhieuDangKy PDK ON i.MaPhieuDangKy = PDK.MaPhieuDangKy
    JOIN KhachHang KH ON PDK.MaKhachHang = KH.MaKhachHang;
END;
GO

-- Trigger: Tính tổng tiền cho Hóa đơn Gia Hạn
CREATE TRIGGER trg_tinh_tongtien_giahan
ON HoaDonGiaHan
INSTEAD OF INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN NhanVien nv ON i.NguoiTao = nv.MaNhanVien
        WHERE nv.VaiTro != N'Kế Toán'
    )
    BEGIN
        RAISERROR(N'Chỉ nhân viên kế toán mới được tạo hóa đơn gia hạn.', 16, 1);
        RETURN;
    END;

    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN PhieuGiaHan PGH ON i.MaPhieuGiaHan = PGH.MaPhieuGiaHan
        JOIN PhieuDangKyGiaHan PDKGH ON PGH.MaPhieuDangKyGiaHan = PDKGH.MaPhieuDangKyGiaHan
        WHERE PDKGH.TruongHop = N'Đặc biệt'
    )
    BEGIN
        RAISERROR(N'Không được tạo hóa đơn gia hạn cho trường hợp đặc biệt.', 16, 1);
        RETURN;
    END;

    INSERT INTO HoaDonGiaHan (
        MaHoaDon, MaPhieuGiaHan, TongTien,
        NgayLapHoaDon, PhuongThucThanhToan, TrangThaiThanhToan, NguoiTao
    )
    SELECT 
        i.MaHoaDon, i.MaPhieuGiaHan,
        CASE 
            WHEN KH.DonVi = 'Không' THEN 70000
            ELSE 400000
        END,
        i.NgayLapHoaDon, i.PhuongThucThanhToan, i.TrangThaiThanhToan, i.NguoiTao
    FROM inserted i
    JOIN PhieuGiaHan PGH ON i.MaPhieuGiaHan = PGH.MaPhieuGiaHan
    JOIN PhieuDangKyGiaHan PDKGH ON PGH.MaPhieuDangKyGiaHan = PDKGH.MaPhieuDangKyGiaHan
    JOIN PhieuDuThi PDT ON PDKGH.MaPhieuDuThi = PDT.MaPhieuDuThi
    JOIN ThiSinh TS ON PDT.MaThiSinh = TS.MaThiSinh
    JOIN KhachHang KH ON TS.MaKhachHang = KH.MaKhachHang;
END;
GO

-- Trigger: Kiểm tra vai trò khi tạo phiếu gia hạn
CREATE TRIGGER trg_check_role_ketoan_pg
ON PhieuGiaHan
INSTEAD OF INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN NhanVien nv ON i.NguoiTao = nv.MaNhanVien
        WHERE nv.VaiTro != N'Kế Toán'
    )
    BEGIN
        RAISERROR(N'Chỉ nhân viên kế toán mới được tạo phiếu gia hạn.', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN PhieuGiaHan p ON i.MaPhieuDangKyGiaHan = p.MaPhieuDangKyGiaHan
    )
    BEGIN
        RAISERROR(N'Mỗi phiếu đăng ký gia hạn chỉ có 1 phiếu gia hạn.', 16, 1);
        RETURN;
    END

    INSERT INTO PhieuGiaHan SELECT * FROM inserted;
END;
GO

-- Trigger: Kiểm tra vai trò khi tạo Lịch thi
CREATE TRIGGER trg_check_role_tiepnhan_lichthi
ON LichThi
INSTEAD OF INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN NhanVien nv ON i.NguoiTao = nv.MaNhanVien
        WHERE nv.VaiTro != N'Tiếp nhận'
    )
    BEGIN
        RAISERROR(N'Chỉ nhân viên tiếp nhận mới được tạo lịch thi.', 16, 1);
        RETURN;
    END

    INSERT INTO LichThi SELECT * FROM inserted;
END;
GO

-- Trigger: Kiểm tra vai trò khi tạo phiếu đăng ký
CREATE TRIGGER trg_check_role_tiepnhan_dk
ON PhieuDangKy
INSTEAD OF INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN NhanVien nv ON i.NguoiTao = nv.MaNhanVien
        WHERE nv.VaiTro != N'Tiếp nhận'
    )
    BEGIN
        RAISERROR(N'Chỉ nhân viên tiếp nhận mới được tạo phiếu đăng ký.', 16, 1);
        RETURN;
    END

    INSERT INTO PhieuDangKy SELECT * FROM inserted;
END;
GO

-- Trigger: Kiểm tra khách hàng đơn vị có >= 10 thí sinh cùng lịch thi
CREATE TRIGGER trg_check_lichthi_10_thisinh
ON ThiSinh
AFTER INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN KhachHang kh ON i.MaKhachHang = kh.MaKhachHang
        WHERE kh.DonVi != 'Không'
          AND (
            SELECT COUNT(*)
            FROM ThiSinh ts
            JOIN PhieuDuThi pdt ON ts.MaThiSinh = pdt.MaThiSinh
            WHERE ts.MaKhachHang = kh.MaKhachHang
              AND pdt.MaLichThi IN (
                  SELECT pdt2.MaLichThi
                  FROM PhieuDuThi pdt2
                  JOIN ThiSinh ts2 ON pdt2.MaThiSinh = ts2.MaThiSinh
                  WHERE ts2.MaKhachHang = kh.MaKhachHang
                  GROUP BY pdt2.MaLichThi
                  HAVING COUNT(*) < 10
              )
        ) > 0
    )
    BEGIN
        RAISERROR(N'Khách hàng đơn vị phải có ít nhất 10 thí sinh cùng lịch thi.', 16, 1);
        ROLLBACK;
    END
END;
GO

-- Trigger: Kiểm tra số lượng phiếu đăng ký gia hạn khớp với số lần gia hạn còn lại
CREATE TRIGGER trg_check_solan_vs_sophieu_dkgiahan
ON PhieuDangKyGiaHan
AFTER INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN PhieuDuThi pdt ON i.MaPhieuDuThi = pdt.MaPhieuDuThi
        GROUP BY pdt.MaPhieuDuThi, pdt.SoLanGiaHanConLai
        HAVING COUNT(i.MaPhieuDangKyGiaHan) > (2 - pdt.SoLanGiaHanConLai)
    )
    BEGIN
        RAISERROR(N'Số lượng phiếu đăng ký gia hạn không phù hợp với số lần gia hạn còn lại.', 16, 1);
        ROLLBACK;
    END
END;
GO

CREATE TRIGGER trg_check_insert_dkgiahan
ON PhieuDangKyGiaHan
INSTEAD OF INSERT
AS
BEGIN
    -- Chỉ nhân viên tiếp nhận được phép tạo
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN NhanVien nv ON i.NguoiTao = nv.MaNhanVien
        WHERE nv.VaiTro != N'Tiếp nhận'
    )
    BEGIN
        RAISERROR(N'Chỉ nhân viên tiếp nhận mới được tạo phiếu đăng ký gia hạn.', 16, 1);
        RETURN;
    END;

    -- Ngày xử lý phải >= ngày yêu cầu
    IF EXISTS (
        SELECT 1 FROM inserted WHERE NgayXuLy < NgayYeuCau
    )
    BEGIN
        RAISERROR(N'Ngày xử lý phải bằng hoặc sau ngày yêu cầu.', 16, 1);
        RETURN;
    END;

    INSERT INTO PhieuDangKyGiaHan SELECT * FROM inserted;
END;
GO

CREATE TRIGGER trg_check_insert_saisot
ON SaiSotBaiThi
INSTEAD OF INSERT
AS
BEGIN
    -- Kiểm tra vai trò
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN NhanVien nv ON i.NguoiTao = nv.MaNhanVien
        WHERE nv.VaiTro != N'Nhập liệu'
    )
    BEGIN
        RAISERROR(N'Chỉ nhân viên nhập liệu mới được tạo sai sót bài thi.', 16, 1);
        RETURN;
    END;

    -- Mỗi bài thi chỉ có 1 sai sót
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN SaiSotBaiThi ss ON i.MaBaiThi = ss.MaBaiThi
    )
    BEGIN
        RAISERROR(N'Mỗi bài thi chỉ được ghi nhận một sai sót.', 16, 1);
        RETURN;
    END;

    INSERT INTO SaiSotBaiThi SELECT * FROM inserted;
END;
GO

CREATE TRIGGER trg_check_machungchi_donvi
ON BaiThi
INSTEAD OF INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN BaiThi b ON i.MaDonVi = b.MaDonVi
        JOIN ChungChi cc1 ON i.MaChungChi = cc1.MaChungChi
        JOIN ChungChi cc2 ON b.MaChungChi = cc2.MaChungChi
        WHERE cc1.LoaiChungChi != cc2.LoaiChungChi
    )
    BEGIN
        RAISERROR(N'Mỗi đơn vị chấm thi chỉ được chấm một loại chứng chỉ.', 16, 1);
        RETURN;
    END

    INSERT INTO BaiThi SELECT * FROM inserted;
END;
GO