#!/usr/bin/env node
/**
 * Generate Argon2id password hash for BiYu Boxing admin users
 * Usage: node scripts/generate-password-hash.js "your-password-here"
 */

import argon2 from 'argon2';

const password = process.argv[2];

if (!password) {
  console.error('❌ Usage: node scripts/generate-password-hash.js "your-password-here"');
  process.exit(1);
}

(async () => {
  try {
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4
    });

    console.log('\n✅ Password hash generated:');
    console.log(hash);
    console.log('\nAdd this to your .env file:');
    console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
    console.log('\n⚠️  Keep this secure! Do NOT commit to git.\n');
  } catch (error) {
    console.error('❌ Error generating hash:', error.message);
    process.exit(1);
  }
})();
