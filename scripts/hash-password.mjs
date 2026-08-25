#!/usr/bin/env node
/** Turns a password into the ADMIN_PASSWORD_HASH value.  npm run hash-password -- "your password" */
import { scryptSync, randomBytes } from 'node:crypto';

const password = process.argv.slice(2).join(' ').trim();
if (!password) {
  console.error('\nUsage: npm run hash-password -- "your password"\n');
  process.exit(1);
}
if (password.length < 10) {
  console.error('\nUse at least 10 characters.\n');
  process.exit(1);
}
const salt = randomBytes(16).toString('hex');
const derived = scryptSync(password, salt, 64).toString('hex');
console.log('\nADMIN_PASSWORD_HASH="scrypt:' + salt + ':' + derived + '"\n');
console.log('AUTH_SECRET="' + randomBytes(32).toString('hex') + '"\n');
