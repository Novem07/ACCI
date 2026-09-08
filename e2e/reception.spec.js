import { expect, test } from '@playwright/test';
import { installMockApi } from './helpers/mock-api.js';

const receptionUser = { name: 'Nhân viên tiếp nhận', role: 'Tiếp nhận' };

test('registration entry creates a queue item without client-owned fields', async ({ page }) => {
  await installMockApi(page, {
    user: receptionUser,
    responses: {
      'GET /customers?page=1&pageSize=100': { items: [{ id: 'KH000001', fullName: 'Nguyễn Văn A' }] },
      'GET /catalog/certificates': { certificates: [{ id: 'CC001', name: 'Chứng chỉ mẫu' }] },
      'POST /registrations': { registration: { id: 'PDK000001' } },
      'GET /registrations?page=1&pageSize=20': {
        items: [{ id: 'PDK000001', customerId: 'KH000001', candidateCount: 1, registrationDate: '2030-05-06', status: 'Chờ phát hành' }],
        page: 1, pageSize: 20, totalItems: 1, totalPages: 1,
      },
    },
  });
  await page.goto('/taophieu');

  await page.getByLabel(/Chọn khách hàng/).selectOption('KH000001');
  await page.getByLabel(/Họ tên thí sinh/).fill('Trần Minh An');
  await page.getByLabel(/Chứng chỉ/).selectOption('CC001');
  await page.getByLabel(/CCCD thí sinh/).fill('079123456789');
  await page.getByLabel(/SĐT thí sinh/).fill('0901234567');
  await page.getByLabel(/Email thí sinh/).fill('an@example.com');
  await page.getByLabel(/Địa chỉ thí sinh/).fill('TP.HCM');
  await page.getByRole('button', { name: 'Thêm thí sinh' }).click();
  await expect(page.getByRole('table', { name: 'Danh sách thí sinh đăng ký' })).toContainText('Trần Minh An');

  await page.getByRole('button', { name: 'Tạo phiếu đăng ký' }).click();
  await expect(page).toHaveURL(/\/tiepnhan$/);
  await expect(page.getByRole('table', { name: 'Danh sách phiếu đăng ký' })).toContainText('PDK000001');
});
