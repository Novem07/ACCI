const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');

test('demo user seed preserves Vietnamese text through sqlcmd', () => {
  const seedSql = fs.readFileSync(path.join(root, 'database', 'seed', 'demo_users.sql'), 'utf8');
  const seedScript = fs.readFileSync(path.join(root, 'scripts', 'seed-demo.ps1'), 'utf8');

  assert.match(seedSql, /N'Tiếp nhận'/);
  assert.match(seedSql, /N'Nguyễn Văn A'/);
  assert.match(seedScript, /sqlcmd @arguments -f 65001/);
});
