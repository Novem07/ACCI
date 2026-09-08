import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Dialog } from '../index';

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={() => setOpen(true)}>Mở</button><Dialog open={open} title="Xác nhận" onClose={() => setOpen(false)}>Nội dung</Dialog></>;
}

it('moves focus into the dialog and restores it on Escape', async () => {
  render(<DialogHarness />);
  const trigger = screen.getByRole('button', { name: 'Mở' });
  await userEvent.click(trigger);
  expect(screen.getByRole('dialog')).toContainElement(document.activeElement);
  await userEvent.keyboard('{Escape}');
  expect(trigger).toHaveFocus();
});
