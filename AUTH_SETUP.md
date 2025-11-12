# Authentication Setup Guide

## New Authentication System

The site now uses **username/password authentication with Argon2id hashing** instead of simple auth keys.

### For Existing Users

**Admin and Lee:** Your usernames remain the same. You'll need to set new passwords.

---

## Initial Setup

### Step 1: Generate Password Hashes

Run this command to generate a hashed password:

```bash
node scripts/generate-password-hash.js "YourPasswordHere"
```

**Example:**
```bash
node scripts/generate-password-hash.js "SecurePassword123!"
```

**Output:**
```
✅ Password hash generated:
$argon2id$v=19$m=65536,t=3,p=4$abc123...

Add this to your .env file:
ADMIN_PASSWORD_HASH="$argon2id$v=19$m=65536,t=3,p=4$abc123..."

⚠️  Keep this secure! Do NOT commit to git.
```

### Step 2: Update .env File

Copy the generated hash to your `.env` file:

```bash
# For admin user
ADMIN_PASSWORD_HASH="$argon2id$v=19$m=65536,t=3,p=4$..."

# For lee user
LEE_PASSWORD_HASH="$argon2id$v=19$m=65536,t=3,p=4$..."
```

### Step 3: Remove Old Auth Keys

Delete these lines from `.env`:
```bash
ADMIN_AUTH_KEY=...  # ← DELETE THIS
LEE_AUTH_KEY=...    # ← DELETE THIS
```

---

## Login Instructions

### New Login Flow

1. Go to `/admin` or `/admin/auth`
2. Enter username: `admin` or `lee`
3. Enter your password
4. Click "Sign In"

### Account Lockout

- After **5 failed login attempts**, the account locks for **15 minutes**
- This prevents brute-force attacks
- Lockout resets automatically after 15 minutes

---

## Password Requirements

Use a strong password with:
- At least 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No dictionary words

**Good examples:**
- `BiYu@Boxing2025!Secure`
- `LeeAdmin$P@ssw0rd2025`

---

## Deployment Checklist

Before deploying to production:

- [ ] Generate secure password hashes for both users
- [ ] Update server's .env file with new hashes
- [ ] Remove old AUTH_KEY env vars from server
- [ ] Test login with new credentials locally
- [ ] Deploy updated code to server
- [ ] Test login on production
- [ ] Verify old auth key login no longer works

---

## Troubleshooting

### "No password hash configured for user"

**Problem:** Missing `ADMIN_PASSWORD_HASH` or `LEE_PASSWORD_HASH` in .env

**Solution:**
1. Generate hash: `node scripts/generate-password-hash.js "your-password"`
2. Add to `.env` file
3. Restart server

### "Account locked"

**Problem:** Too many failed login attempts

**Solution:**
- Wait 15 minutes for automatic unlock
- OR restart the server to clear lockout state

### Login form shows 500 error

**Problem:** argon2 package not installed

**Solution:**
```bash
npm install argon2
```

---

## Security Notes

✅ **DO:**
- Use unique passwords for each user
- Store .env file securely (never commit to git)
- Rotate passwords periodically
- Use password manager to store credentials

❌ **DON'T:**
- Share passwords via email/Slack
- Reuse passwords from other sites
- Commit .env file to git
- Use weak passwords like "password123"

---

## Migration from Old System

The old `validateAuthKey()` system is **deprecated** but kept for backwards compatibility.

**Timeline:**
1. ✅ New system is live (username/password)
2. ⏳ Old auth key system still works temporarily
3. 🗑️ Old system will be removed in future update

**Action Required:** Switch to new system ASAP.

---

Generated: November 9, 2025
