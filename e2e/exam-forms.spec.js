import { expect, test } from '@playwright/test';
import { installMockApi } from './helpers/mock-api.js';

test('exam organization can open an exam form from its paginated list', async ({ page }) => {
  await installMockApi(page, {
    user: { name: 'Tổ chức thi ACCI', role: 'Tổ chức thi' },
    responses: {
      'GET /exam-forms?page=1&pageSize=20': {
        items: [{
          examFormId: 'PDT000001',
          candidateId: 'TS000001',
          examDate: '2030-05-12',
          examTime: '08:00',
          status: 'Đã xếp lịch',
        }],
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      },
      'GET /exam-forms/PDT000001': {
        examForm: {
          examFormId: 'PDT000001',
          candidateId: 'TS000001',
          certificateName: 'Chứng chỉ mẫu',
          examDate: '2030-05-12',
          examTime: '08:00',
          status: 'Đã xếp lịch',
        },
      },
    },
  });

  await page.goto('/phieuduthi');

  await page.getByRole('link', { name: 'PDT000001' }).click();
  await expect(page).toHaveURL(/\/phieuduthi\/PDT000001$/);
  await expect(page.getByText('Chứng chỉ mẫu')).toBeVisible();
  await expect(page.getByText('Đã xếp lịch')).toBeVisible();
});
