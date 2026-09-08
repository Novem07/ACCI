import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installMockApi } from './helpers/mock-api.js';

const reception = { name: 'Nhân viên tiếp nhận', role: 'Tiếp nhận' };
const accounting = { name: 'Kế toán ACCI', role: 'Kế Toán' };
const organizer = { name: 'Tổ chức thi ACCI', role: 'Tổ chức thi' };

const examForm = {
  examFormId: 'PDT000001',
  candidateId: 'TS000001',
  certificateName: 'Chứng chỉ mẫu',
  examDate: '2030-05-12',
  examTime: '08:00',
  remainingAttempts: 1,
  status: 'Đã xếp lịch',
};

async function expectNoSeriousViolations(page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact))).toEqual([]);
}

test('login has no serious accessibility violations', async ({ page }) => {
  await installMockApi(page, { user: null });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('reception workflows have no serious accessibility violations', async ({ page }) => {
  await installMockApi(page, {
    user: reception,
    responses: {
      'GET /registrations?page=1&pageSize=20': { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      'GET /customers?page=1&pageSize=100': { items: [{ id: 'KH000001', fullName: 'Nguyễn Văn A' }] },
      'GET /catalog/certificates': { certificates: [{ id: 'CC001', name: 'Chứng chỉ mẫu' }] },
    },
  });

  await page.goto('/tiepnhan');
  await expect(page.getByRole('heading', { name: 'Phiếu đăng ký', exact: true })).toBeVisible();
  await expectNoSeriousViolations(page);

  await page.goto('/taophieu');
  await expect(page.getByRole('heading', { name: 'Lập phiếu đăng ký' })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('accounting workflows have no serious accessibility violations', async ({ page }) => {
  await installMockApi(page, {
    user: accounting,
    responses: {
      'GET /payments?page=1&pageSize=20': { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      'GET /payments/PDK000001/checkout': {
        payment: { registrationId: 'PDK000001', customerName: 'Nguyễn Văn A', registrationDate: '2030-05-06', status: 'unpaid', invoiceId: null },
        quote: { currency: 'VND', candidateCount: 1, baseAmount: 1000000, discountAmount: 0, totalAmount: 1000000 },
      },
    },
  });

  await page.goto('/ketoan');
  await expect(page.getByRole('heading', { name: 'Thanh toán' })).toBeVisible();
  await expectNoSeriousViolations(page);

  await page.goto('/ketoan/xuly/PDK000001');
  await expect(page.getByText(/1\.000\.000/).first()).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('exam and extension workflows have no serious accessibility violations', async ({ page }) => {
  await installMockApi(page, {
    user: reception,
    responses: {
      'GET /exam-forms?page=1&pageSize=20': { items: [examForm], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      'GET /exam-forms/PDT000001': { examForm },
      'GET /extensions/PDT000001/extension-options': {
        currentSchedule: { scheduleId: 'LT001', examDate: '2030-05-10', examTime: '08:00' },
        schedules: [{ scheduleId: 'LT002', examDate: '2030-05-13', examTime: '08:00', remainingSeats: 3, eligibility: { allowed: true } }],
      },
    },
  });

  await page.goto('/phieuduthi');
  await expect(page.getByRole('link', { name: 'PDT000001' })).toBeVisible();
  await expectNoSeriousViolations(page);

  await page.goto('/phieuduthi/PDT000001');
  await expect(page.getByText('Chứng chỉ mẫu')).toBeVisible();
  await expectNoSeriousViolations(page);

  await page.goto('/giahan/create/PDT000001');
  await expect(page.getByRole('radio', { name: /LT002/ })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('exam organization dashboard has no serious accessibility violations', async ({ page }) => {
  await installMockApi(page, { user: organizer });
  await page.goto('/home');
  await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible();
  await expectNoSeriousViolations(page);
});
