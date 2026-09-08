import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const clientRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

it('contains no retired page surface, raster branding, or unused UI dependencies', () => {
  const retiredPaths = [
    'src/App.css',
    'src/index.css',
    'src/logo.svg',
    'src/styles/design.css',
    'src/components/AppShell.jsx',
    'src/components/AppShell.css',
    'src/components/AsyncState.jsx',
    'src/components/AsyncState.css',
    'src/components/Icon.jsx',
    'src/components/WarningModal.jsx',
    'src/components/WarningModal.css',
    'src/components/navigation.js',
    'public/LogoACCI.png',
    'public/logo192.png',
    'public/logo512.png',
    'public/favicon.ico',
  ];

  retiredPaths.forEach((path) => expect(existsSync(resolve(clientRoot, path)), path).toBe(false));
  expect(readdirSync(resolve(clientRoot, 'src/pages'))).toEqual([]);

  const manifest = JSON.parse(readFileSync(resolve(clientRoot, 'public/manifest.json'), 'utf8'));
  expect(manifest.name).toBe('ACCI Center');
  expect(JSON.stringify(manifest.icons)).toContain('/brand/favicon.svg');

  const packageJson = JSON.parse(readFileSync(resolve(clientRoot, 'package.json'), 'utf8'));
  expect(packageJson.dependencies).not.toHaveProperty('bootstrap');
  expect(packageJson.dependencies).not.toHaveProperty('font-awesome');
  expect(packageJson.dependencies).not.toHaveProperty('dayjs');
});
