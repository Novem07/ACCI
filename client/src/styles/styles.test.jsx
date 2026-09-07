import { expect, it } from 'vitest';
import tokens from './tokens.css?raw';
import reset from './reset.css?raw';

it('defines the approved semantic color and spacing tokens', () => {
  expect(tokens).toContain('--color-action-primary:');
  expect(tokens).toContain('--color-canvas:');
  expect(tokens).toContain('--font-family-sans:');
  expect(tokens).toContain('--space-6:');
  expect(tokens).toContain("html[data-theme='dark']");
});

it('keeps the reset generic and honors reduced-motion preferences', () => {
  expect(reset).toContain('@media (prefers-reduced-motion: reduce)');
  expect(reset).toContain(':focus-visible');
  expect(reset).not.toContain('!important');
});
