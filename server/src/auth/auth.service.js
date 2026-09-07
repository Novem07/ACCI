const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { sql } = require('../db');

function authError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function createAuthService({ db, jwtSecret, clock = () => new Date() }) {
  async function login(employeeId, password) {
    const result = await db.request()
      .input('employeeId', sql.VarChar(20), employeeId)
      .query(`
        SELECT MaNhanVien, HoTen, VaiTro, MatKhauHash
        FROM NhanVien
        WHERE MaNhanVien = @employeeId
      `);

    const employee = result.recordset[0];
    const valid = employee?.MatKhauHash
      ? await bcrypt.compare(password, employee.MatKhauHash)
      : false;
    if (!valid) throw authError(401, 'INVALID_CREDENTIALS', 'Sai mã nhân viên hoặc mật khẩu.');

    const user = {
      id: employee.MaNhanVien,
      name: employee.HoTen,
      role: employee.VaiTro,
    };
    const token = jwt.sign(
      { sub: user.id, name: user.name, role: user.role },
      jwtSecret,
      { expiresIn: '15m', jwtid: `${user.id}-${clock().getTime()}` }
    );
    return { user, token };
  }

  function verify(token) {
    try {
      const payload = jwt.verify(token, jwtSecret);
      return { id: payload.sub, name: payload.name, role: payload.role };
    } catch {
      throw authError(401, 'UNAUTHENTICATED', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }
  }

  return { login, verify };
}

module.exports = { createAuthService, authError };
