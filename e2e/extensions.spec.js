import { expect, test } from '@playwright/test';
import { installMockApi } from './helpers/mock-api.js';

test('reception can select an eligible replacement schedule for an extension', async ({ page }) => {
  await installMockApi(page, {
    user: { name: 'Nhân viên tiếp nhận', role: 'Tiếp nhận' },
    responses: {
      'GET /extensions/PDT000001/extension-options': {
        currentSchedule: { scheduleId: 'LT001', examDate: '2030-05-10', examTime: '08:00' },
        schedules: [
          { scheduleId: 'LT002', examDate: '2030-05-11', examTime: '08:00', remainingSeats: 0, eligibility: { allowed: false, reason: 'SCHEDULE_FULL' } },
          { scheduleId: 'LT003', examDate: '2030-05-13', examTime: '08:00', remainingSeats: 3, eligibility: { allowed: true } },
        ],
      },
      'POST /extensions': { extension: { id: 'PGH000001' } },
      'GET /exam-forms?page=1&pageSize=20': { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    },
  });

  await page.goto('/giahan/create/PDT000001');

  await expect(page.getByRole('radio', { name: /LT002/ })).toBeDisabled();
  await page.getByRole('radio', { name: /LT003/ }).check();
  await page.getByRole('button', { name: 'Gửi yêu cầu gia hạn' }).click();

  await expect(page).toHaveURL(/\/giahan$/);
  await expect(page.getByRole('heading', { name: 'Gia hạn chứng chỉ' })).toBeVisible();
});
