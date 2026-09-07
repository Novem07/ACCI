const bcrypt = require('bcryptjs');

async function main() {
  const password = process.env.DEMO_PASSWORD;
  if (!password) {
    throw new Error('Set DEMO_PASSWORD in the process environment.');
  }
  process.stdout.write(`${await bcrypt.hash(password, 12)}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
