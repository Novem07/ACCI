import { expect, test } from '@playwright/test';
import { installMockApi } from './helpers/mock-api.js';

const receptionUser = { name: 'Nhân viên tiếp nhận', role: 'Tiếp nhận' };

test('navigation keeps the shell and painted content background', async ({ page }) => {
  await installMockApi(page, { user: receptionUser, responses: { 'GET /registrations': { registrations: [] } } });
  await page.goto('/home');

  const shell = page.getByTestId('app-shell');
  await expect(shell).toBeVisible();
  const menu = page.getByRole('button', { name: 'Mở điều hướng' });
  const isMobileMenu = await menu.isVisible();
  if (isMobileMenu) await menu.click();
  await shell.getByRole('link', { name: 'Phiếu đăng ký', exact: true }).click();

  await expect(shell).toBeVisible();
  if (isMobileMenu) await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('app-content')).toHaveCSS('background-color', 'rgb(245, 247, 250)');
});
