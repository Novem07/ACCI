import { expect, test } from '@playwright/test';
import { installMockApi } from './helpers/mock-api.js';

test('accounting checkout confirms a server quote and renders a receipt', async ({ page }) => {
  await installMockApi(page, { user: { name: 'Kế toán ACCI', role: 'Kế Toán' }, responses: {
    'GET /payments/PDK000001/checkout': { payment: { registrationId: 'PDK000001', customerName: 'Nguyễn Văn A', registrationDate: '2030-05-06', status: 'unpaid', invoiceId: null }, quote: { currency: 'VND', candidateCount: 1, baseAmount: 1000000, discountAmount: 100000, totalAmount: 900000 } },
    'POST /payments/PDK000001/invoices': { invoice: { invoiceId: 'HD000001', paymentStatus: 'Đã thanh toán' } },
  } });
  await page.goto('/ketoan/xuly/PDK000001');
  await expect(page.getByText(/900\.000/)).toBeVisible();
  await page.getByLabel(/Phương thức thanh toán/).selectOption('Chuyển khoản');
  await page.getByRole('button', { name: 'Xác nhận thanh toán' }).click();
  await expect(page.getByRole('status')).toContainText('Thanh toán thành công');
  await expect(page.getByRole('button', { name: 'Đã thanh toán' })).toBeDisabled();
});
