export const ROLES = {
  reception: 'Tiếp nhận',
  accounting: 'Kế Toán',
  examOrganization: 'Tổ chức thi',
  dataEntry: 'Nhập liệu',
  proctor: 'Coi thi',
};

export const PATHS = {
  login: '/', home: '/home', registrations: '/tiepnhan', registrationCreate: '/taophieu', accounting: '/ketoan', accountingProcess: '/ketoan/xuly/:maPDK', examOrganization: '/tochucthi', dataEntry: '/nhaplieu', proctor: '/coithi', candidates: '/xemthisinh', temporaryCandidates: '/xemtempthisinh', examForms: '/phieuduthi', examFormDetail: '/phieuduthi/:id', extensions: '/giahan', extensionCreate: '/giahan/create/:maPhieu',
};

export const navigationByRole = {
  [ROLES.reception]: [
    { to: PATHS.registrations, label: 'Phiếu đăng ký', icon: 'file', description: 'Theo dõi và tìm kiếm các hồ sơ đăng ký.' },
    { to: PATHS.registrationCreate, label: 'Lập phiếu đăng ký', icon: 'plus', description: 'Tiếp nhận khách hàng và đăng ký thí sinh.' },
    { to: PATHS.extensions, label: 'Gia hạn chứng chỉ', icon: 'clock', description: 'Tra cứu phiếu và gửi yêu cầu gia hạn.' },
    { to: PATHS.candidates, label: 'Thí sinh', icon: 'users', description: 'Tra cứu thông tin thí sinh trong hệ thống.' },
    { to: PATHS.examForms, label: 'Phiếu dự thi', icon: 'file', description: 'Xem lịch thi và thông tin phiếu dự thi.' },
  ],
  [ROLES.accounting]: [
    { to: PATHS.accounting, label: 'Thanh toán', icon: 'file', description: 'Xử lý yêu cầu thanh toán và lập hóa đơn.' },
    { to: PATHS.candidates, label: 'Thí sinh', icon: 'users', description: 'Tra cứu thông tin thí sinh.' },
    { to: PATHS.examForms, label: 'Phiếu dự thi', icon: 'file', description: 'Tra cứu các phiếu dự thi đã phát hành.' },
  ],
  [ROLES.examOrganization]: [
    { to: PATHS.examOrganization, label: 'Tổ chức thi', icon: 'grid', description: 'Không gian làm việc của bộ phận tổ chức thi.' },
    { to: PATHS.examForms, label: 'Phiếu dự thi', icon: 'file', description: 'Tra cứu lịch thi và thông tin phiếu.' },
    { to: PATHS.candidates, label: 'Thí sinh', icon: 'users', description: 'Tra cứu thông tin thí sinh.' },
  ],
  [ROLES.dataEntry]: [{ to: PATHS.dataEntry, label: 'Nhập liệu', icon: 'file', description: 'Không gian làm việc của bộ phận nhập liệu.' }],
  [ROLES.proctor]: [{ to: PATHS.proctor, label: 'Coi thi', icon: 'users', description: 'Không gian làm việc của bộ phận coi thi.' }],
};

export function getLandingPath(role) {
  return navigationByRole[role]?.[0]?.to || PATHS.home;
}
