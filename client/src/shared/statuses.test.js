import { expect, it } from 'vitest';
import { EXAM_FORM_STATUS } from './statuses';

it('maps every persisted exam-form status to a deliberate badge tone', () => {
  expect(EXAM_FORM_STATUS['Đang xử lý']).toEqual({ label: 'Đang xử lý', tone: 'warning' });
  expect(EXAM_FORM_STATUS['Đã xử lý']).toEqual({ label: 'Đã xử lý', tone: 'success' });
  expect(EXAM_FORM_STATUS['Đã phát']).toEqual({ label: 'Đã phát', tone: 'success' });
});
