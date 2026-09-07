const { spawnSync } = require('node:child_process');

const command = process.platform === 'win32' ? 'powershell' : 'pwsh';
const result = spawnSync(command, ['-NoProfile', '-File', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(`Unable to start ${command}: ${result.error.message}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
