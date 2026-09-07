IF DB_ID(N'$(DatabaseName)') IS NULL
BEGIN
    EXEC(N'CREATE DATABASE [$(DatabaseName)]');
END;
GO

USE [$(DatabaseName)];
GO

CREATE TABLE NhanVien (
    MaNhanVien VARCHAR(20) PRIMARY KEY,
    HoTen NVARCHAR(100),
    SDT VARCHAR(15),
    Email VARCHAR(100),
    VaiTro NVARCHAR(50), -- Tiếp nhận, Kế Toán, Tổ chức thi, Nhập liệu, Coi thi
	MatKhauHash VARCHAR(60) NOT NULL
);

CREATE TABLE DonViChamThi (
    MaDonVi VARCHAR(20) PRIMARY KEY, 
    TenDonVi NVARCHAR(100),
    SDT VARCHAR(15),
    DiaChi NVARCHAR(200),
    Email VARCHAR(100)
);

CREATE TABLE KhachHang (
    MaKhachHang VARCHAR(20) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    CCCD VARCHAR(20),
    SDT VARCHAR(15),
    Email VARCHAR(100),
    DiaChi NVARCHAR(200),
    DonVi VARCHAR(20) NOT NULL
);

CREATE TABLE ThiSinh (
    MaThiSinh VARCHAR(20) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    CCCD VARCHAR(20),
    SDT VARCHAR(15),
    Email VARCHAR(100),
    DiaChi NVARCHAR(200),
    MaKhachHang VARCHAR(20),
    FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang)
);

CREATE TABLE PhongThi (
    MaPhongThi VARCHAR(20) PRIMARY KEY,
    SoChoNgoi INT
);

CREATE TABLE ChungChi (
    MaChungChi VARCHAR(20) PRIMARY KEY,
    TenChungChi NVARCHAR(100),
    MoTa NVARCHAR(200),
    LoaiChungChi NVARCHAR(100), --Ngoại ngữ, Tin học
    ThoiHan INT,
    Gia DECIMAL(10, 2)
);

CREATE TABLE LichThi (
    MaLichThi VARCHAR(20) PRIMARY KEY,
    NgayThi DATE,
    GioThi TIME,
    ThoiGianThi INT,
    SoChoTrong INT, -- Số vị trí trống còn lại của phòng thi đó
    MaChungChi VARCHAR(20),
    MaPhongThi VARCHAR(20),
    NguoiTao VARCHAR(20),
    FOREIGN KEY (MaChungChi) REFERENCES ChungChi(MaChungChi),
    FOREIGN KEY (MaPhongThi) REFERENCES PhongThi(MaPhongThi),
    FOREIGN KEY (NguoiTao) REFERENCES NhanVien(MaNhanVien)
);

CREATE TABLE PhieuDangKy (
    MaPhieuDangKy VARCHAR(20) PRIMARY KEY,
    NgayDangKy DATE NOT NULL,
    TrangThaiPhieu NVARCHAR(50) NOT NULL, -- Chờ phát hành, Đã phát hành, Đã hủy
    MaThanhToan NVARCHAR(50),
    MaKhachHang VARCHAR(20) NOT NULL,
    NguoiTao VARCHAR(20) NOT NULL,
    FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    FOREIGN KEY (NguoiTao) REFERENCES NhanVien(MaNhanVien)
);

CREATE TABLE PhieuDuThi (
    MaPhieuDuThi VARCHAR(20) PRIMARY KEY,
    SoBaoDanh VARCHAR(20),
    NgayThi DATE,
    GioThi TIME,
    SoLanGiaHanConLai INT NOT NULL CONSTRAINT DF_PhieuDuThi_SoLanGiaHanConLai DEFAULT 2,
    TrangThaiPhieu NVARCHAR(50) NOT NULL, -- Đang xử lý, Đã xử lý, Đã phát
    MaThiSinh VARCHAR(20) NOT NULL,
    MaChungChi VARCHAR(20) NOT NULL,
    MaPhieuDangKy VARCHAR(20) NOT NULL,
    NguoiTao VARCHAR(20) NOT NULL,
    MaLichThi VARCHAR(20) NOT NULL,
    FOREIGN KEY (MaThiSinh) REFERENCES ThiSinh(MaThiSinh),
    FOREIGN KEY (MaChungChi) REFERENCES ChungChi(MaChungChi),
    FOREIGN KEY (MaPhieuDangKy) REFERENCES PhieuDangKy(MaPhieuDangKy),
    FOREIGN KEY (NguoiTao) REFERENCES NhanVien(MaNhanVien),
    FOREIGN KEY (MaLichThi) REFERENCES LichThi(MaLichThi)
);

CREATE TABLE KetQua (
    MaKetQua VARCHAR(20) PRIMARY KEY,
    DiemSo DECIMAL(5, 2),
    NgayCham DATE,
    TrangThaiChungChi NVARCHAR(50), -- Đã nhận, Đã gửi
    MaChungChi VARCHAR(20),
    MaPhieuDuThi VARCHAR(20),
    NguoiTao VARCHAR(20),
    FOREIGN KEY (MaChungChi) REFERENCES ChungChi(MaChungChi),
    FOREIGN KEY (MaPhieuDuThi) REFERENCES PhieuDuThi(MaPhieuDuThi),
    FOREIGN KEY (NguoiTao) REFERENCES NhanVien(MaNhanVien)
);

CREATE TABLE BaiThi (
    MaBaiThi VARCHAR(20) PRIMARY KEY,
    MaChungChi VARCHAR(20),
    MaPhieuDuThi VARCHAR(20),
    MaDonVi VARCHAR(20),
    FOREIGN KEY (MaChungChi) REFERENCES ChungChi(MaChungChi),
    FOREIGN KEY (MaPhieuDuThi) REFERENCES PhieuDuThi(MaPhieuDuThi),
    FOREIGN KEY (MaDonVi) REFERENCES DonViChamThi(MaDonVi)
);

CREATE TABLE SaiSotBaiThi (
    MaSaiSot VARCHAR(20) PRIMARY KEY,
    NoiDung NVARCHAR(200),
    MaBaiThi VARCHAR(20),
    NguoiTao VARCHAR(20),
    FOREIGN KEY (MaBaiThi) REFERENCES BaiThi(MaBaiThi),
    FOREIGN KEY (NguoiTao) REFERENCES NhanVien(MaNhanVien)
);

CREATE TABLE ChiTietCoiThi (
    MaPhongThi VARCHAR(20),
    MaNhanVien VARCHAR(20),
    VaiTro NVARCHAR(50), -- Giám thị chính, Giám thị phụ, Giám sát hành lang.
    PRIMARY KEY (MaPhongThi, MaNhanVien),
    FOREIGN KEY (MaPhongThi) REFERENCES PhongThi(MaPhongThi),
    FOREIGN KEY (MaNhanVien) REFERENCES NhanVien(MaNhanVien)
);

CREATE TABLE PhieuDangKyGiaHan (
    MaPhieuDangKyGiaHan VARCHAR(20) PRIMARY KEY,
    TruongHop NVARCHAR(100) NOT NULL, -- Thường, Đặc biệt
    MaLichThiMoi VARCHAR(20) NOT NULL,
    NgayYeuCau DATE NOT NULL,
    NgayXuLy DATE,
    MaPhieuDuThi VARCHAR(20) NOT NULL,
    NguoiTao VARCHAR(20) NOT NULL,
    CONSTRAINT FK_PDKGH_LichThiMoi FOREIGN KEY (MaLichThiMoi) REFERENCES LichThi(MaLichThi),
    FOREIGN KEY (MaPhieuDuThi) REFERENCES PhieuDuThi(MaPhieuDuThi),
    FOREIGN KEY (NguoiTao) REFERENCES NhanVien(MaNhanVien)
);

CREATE TABLE PhieuGiaHan (
    MaPhieuGiaHan VARCHAR(20) PRIMARY KEY,
    NgayLapPhieu DATE,
    TrangThaiThanhToan NVARCHAR(50), -- Đã thanh toán, Chưa thanh toán
    MaPhieuDangKyGiaHan VARCHAR(20),
    NguoiTao VARCHAR(20),
    FOREIGN KEY (MaPhieuDangKyGiaHan) REFERENCES PhieuDangKyGiaHan(MaPhieuDangKyGiaHan),
    FOREIGN KEY (NguoiTao) REFERENCES NhanVien(MaNhanVien)
);

CREATE TABLE HoaDonDangKy (
    MaHoaDon VARCHAR(20),
    MaPhieuDangKy VARCHAR(20),
    Gia DECIMAL(10,2),
    SoLuongThiSinh INT,
    TroGia DECIMAL(10,2),
	TongTien DECIMAL(12,2),
	NgayLapHoaDon DATE,
	PhuongThucThanhToan NVARCHAR(50),
    TrangThaiThanhToan NVARCHAR(50), -- Đã thanh toán, Chưa thanh toán
    NguoiTao VARCHAR(20),
    PRIMARY KEY (MaHoaDon, MaPhieuDangKy),
    FOREIGN KEY (MaPhieuDangKy) REFERENCES PhieuDangKy(MaPhieuDangKy),
	FOREIGN KEY (NguoiTao) REFERENCES NhanVien(MaNhanVien)
);


CREATE TABLE HoaDonGiaHan (
	MaHoaDon VARCHAR(20),
    MaPhieuGiaHan VARCHAR(20),
    TongTien DECIMAL(12,2),
	NgayLapHoaDon DATE,
	PhuongThucThanhToan NVARCHAR(50),
    TrangThaiThanhToan NVARCHAR(50), -- Đã thanh toán, Chưa thanh toán
    NguoiTao VARCHAR(20),
    PRIMARY KEY (MaHoaDon, MaPhieuGiaHan),
    FOREIGN KEY (MaPhieuGiaHan) REFERENCES PhieuGiaHan(MaPhieuGiaHan),
	FOREIGN KEY (NguoiTao) REFERENCES NhanVien(MaNhanVien)
);

CREATE TABLE ChiTietPhieuDangKy (
    MaPhieuDangKy VARCHAR(20) NOT NULL,
    MaThiSinh VARCHAR(20) NOT NULL,
    MaChungChi VARCHAR(20) NOT NULL,
    CONSTRAINT PK_ChiTietPhieuDangKy PRIMARY KEY (MaPhieuDangKy, MaThiSinh),
    FOREIGN KEY (MaPhieuDangKy) REFERENCES PhieuDangKy(MaPhieuDangKy),
    FOREIGN KEY (MaThiSinh) REFERENCES ThiSinh(MaThiSinh),
    FOREIGN KEY (MaChungChi) REFERENCES ChungChi(MaChungChi)
);

CREATE TABLE QuyDinh (
    MaQuyDinh VARCHAR(20) PRIMARY KEY,
    TenQuyDinh NVARCHAR(100),
    NoiDung NVARCHAR(200)
);


-- data mẫu
INSERT INTO NhanVien (MaNhanVien, HoTen, SDT, Email, VaiTro, MatKhauHash) VALUES
('NV001', N'Nguyễn Văn A', '0901234567', 'nva@example.com', N'Tiếp nhận', '$2b$12$UA9x99BaLyb46uO89Rla0.DbJv51CFOCs6B4JMEh2tVeEujzTK27m'),
('NV002', N'Trần Thị B', '0902345678', 'ttb@example.com', N'Kế Toán', '$2b$12$/DP0gzq4lTKywM1o76/b3ue/Lvu2KwwNp8HuR9qPmRxa0SMiDBKka'),
('NV003', N'Lê Văn C', '0903456789', 'lvc@example.com', N'Tổ chức thi', '$2b$12$2SwiOEejNsVgcmwVT1kcq.g8qJfdM96QLvc9loooYXnM54d0G4zuC'),
('NV004', N'Phạm Thị D', '0904567890', 'ptd@example.com', N'Nhập liệu', '$2b$12$kSiXoDNeM1gTLmxeMYDK6e40.6KfizAYMc2V4lpdLcnfXP/O3GF6S'),
('NV005', N'Hoàng Văn E', '0905678901', 'hve@example.com', N'Coi thi', '$2b$12$sbu0iFfgb8EnhgkcLmMKAOTrFKOCjiETMqVQtc.IGaXw7KxzwGr9C');
