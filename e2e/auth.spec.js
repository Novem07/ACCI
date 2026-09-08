import { expect, test } from '@playwright/test';
import { installMockApi } from './helpers/mock-api.js';

test('a user can log in, reach the allowed workspace, and log out', async ({ page }) => {
  const reception = { name: 'Nhân viên tiếp nhận', role: 'Tiếp nhận' };
  await installMockApi(page, {
    user: null,
    responses: {
      'POST /auth/login': { user: reception },
      'POST /auth/logout': {},
      'GET /registrations?page=1&pageSize=20': { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    },
  });

  await page.goto('/');
  await page.getByLabel('Mã nhân viên').fill('NV001');
  await page.getByRole('textbox', { name: /Mật khẩu/ }).fill('demo-password');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page).toHaveURL(/\/tiepnhan$/);
  await expect(page.getByRole('heading', { name: 'Phiếu đăng ký', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
});

test('an accounting user is redirected away from a reception-only route', async ({ page }) => {
  await installMockApi(page, { user: { name: 'Kế toán ACCI', role: 'Kế Toán' } });
  await page.goto('/taophieu');

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('heading', { name: /Xin chào, Kế toán ACCI/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Thanh toán' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lập phiếu đăng ký' })).toHaveCount(0);
});
