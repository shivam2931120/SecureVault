# 🔧 AUTHENTICATION TROUBLESHOOTING GUIDE

## Issue: "You're Offline" Error During Registration/Login

### ✅ What I Fixed

1. **Enhanced Error Handling**
   - Added detailed console logging to registration and login flows
   - Better error messages for network issues
   - Catch network errors before they become browser offline pages

2. **Debug Tools Added**
   - Created `/debug` page - Test server connectivity and API health
   - Error boundary with helpful recovery options
   - Console logging at every step of auth process

3. **Removed Deprecated Middleware**
   - Cleaned up Next.js 16 deprecation warnings

---

## 🚨 Root Cause Analysis

The "You're Offline" page with purple/blue gradient is **NOT from our code**. It's either:

1. **Browser's built-in offline page** (most likely)
2. **Browser extension** interfering
3. **Dev server stopped** during request
4. **Browser in offline mode**

---

## 🛠️ HOW TO FIX IT

### Step 1: Check Dev Server

Open terminal in VS Code and run:

```bash
cd /home/shivam/secure-vault
npm run dev
```

**You should see:**
```
✓ Ready in 2s
- Local:   http://localhost:3000
```

**If it's NOT running**, start it and keep it running!

---

### Step 2: Open Debug Panel

Visit: **http://localhost:3000/debug**

This will:
- ✅ Test server connectivity
- ✅ Check API endpoints
- ✅ Verify browser online status
- ✅ Show detailed diagnostics

---

### Step 3: Check Browser Console

1. Open browser (Chrome/Firefox/Edge)
2. Press **F12** or **Right-click → Inspect**
3. Go to **Console** tab
4. Try to register/login
5. Look for messages starting with `[Register]` or `[Login]`

**Good output:**
```
[Register] Starting registration for: test@example.com
[Register] Salt generated
[Register] Deriving master key...
[Register] Master key derived
[Register] Sending request to /api/auth/register
[Register] Response status: 201
[Register] Registration successful
```

**Bad output:**
```
[Register] Network error: Failed to fetch
```

---

### Step 4: Browser Offline Mode Check

1. Open DevTools (F12)
2. Go to **Network** tab
3. Look for **"Offline"** checkbox or throttling dropdown
4. Make sure it says **"No throttling"** or **"Online"**

---

### Step 5: Clear Browser Cache

**Chrome:**
- Press `Ctrl+Shift+Delete`
- Select "Cached images and files"
- Click "Clear data"
- Reload: `Ctrl+Shift+R`

**Firefox:**
- Press `Ctrl+Shift+Delete`
- Select "Cache"
- Click "Clear Now"
- Reload: `Ctrl+Shift+R`

---

### Step 6: Disable Browser Extensions

Extensions can interfere with local development:

1. Open browser extensions page
2. Temporarily disable ALL extensions
3. Try registration again

Common culprits:
- Ad blockers
- Privacy extensions
- VPN extensions
- Developer tools

---

### Step 7: Try Different Browser

If Chrome shows offline page:
- Try Firefox
- Try Edge
- Try Brave

This helps isolate if it's browser-specific.

---

## 🔍 DETAILED DEBUGGING STEPS

### Check 1: Verify Server Response

Open a new terminal:

```bash
curl http://localhost:3000/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","salt":"abc123"}'
```

**Expected:** User created or "Email already exists"
**Problem:** Connection refused or timeout

---

### Check 2: Network Tab Analysis

1. Open DevTools → Network tab
2. Try to register
3. Look for request to `/api/auth/register`

**Possible issues:**
- ❌ Request never appears → JavaScript error
- ❌ Request shows "failed" → Server not responding
- ❌ Status (canceled) → Browser blocked it
- ✅ Status 201/400 → Server working correctly

---

### Check 3: Console Errors

Look for these errors:

**CORS Error:**
```
Access to fetch blocked by CORS policy
```
**Fix:** This shouldn't happen on localhost, but restart dev server

**Network Error:**
```
Failed to fetch
TypeError: NetworkError when attempting to fetch resource
```
**Fix:** Dev server is stopped or port 3000 is blocked

**Parse Error:**
```
SyntaxError: Unexpected token < in JSON
```
**Fix:** Server returning HTML instead of JSON (500 error)

---

## 📝 QUICK CHECKLIST

Before asking for help, verify:

- [ ] Dev server is running (`npm run dev`)
- [ ] Visit http://localhost:3000 loads landing page
- [ ] Browser console shows no red errors
- [ ] `/debug` page shows all tests passing
- [ ] Browser is NOT in offline mode
- [ ] No VPN or proxy interfering
- [ ] Tried hard refresh (`Ctrl+Shift+R`)
- [ ] Tried incognito/private mode

---

## 🎯 TEST REGISTRATION STEP BY STEP

1. **Start fresh:**
   ```bash
   cd /home/shivam/secure-vault
   npm run dev
   ```

2. **Open browser:** http://localhost:3000/auth/register

3. **Open console:** Press F12

4. **Fill form:**
   - Email: anything@example.com
   - Password: test1234
   - Confirm: test1234

5. **Watch console while clicking "Create Account"**

6. **Check for logs:**
   - Should see `[Register]` messages
   - Last message should be "Redirecting to vault"

---

## 🚀 ALTERNATIVE: USING DEBUG PANEL

Instead of registration page, try this first:

1. Visit: **http://localhost:3000/debug**
2. Click **"Recheck Status"**
3. All tests should show green ✓
4. If any test fails, check that specific issue
5. Then try **"Try Registration"** button

---

## 💡 STILL NOT WORKING?

If you've tried everything above and still see offline page:

### Last Resort Fixes:

1. **Restart Computer** (clears all network caches)

2. **Check Firewall** (might be blocking localhost:3000)
   ```bash
   sudo ufw status
   ```

3. **Try Different Port**
   ```bash
   PORT=3001 npm run dev
   ```
   Then visit: http://localhost:3001

4. **Check `/etc/hosts`** (might have localhost issues)
   ```bash
   cat /etc/hosts | grep localhost
   ```
   Should show: `127.0.0.1 localhost`

5. **Fresh Install**
   ```bash
   rm -rf node_modules .next
   npm install
   npm run dev
   ```

---

## 📊 SUCCESS INDICATORS

You know it's working when:

✅ Console shows: `[Register] Registration successful`
✅ Toast message: "Account created successfully!"
✅ URL changes to: `/vault`
✅ You see the vault dashboard with sidebar

---

## 🆘 GET HELP

If still broken, provide these details:

1. Output of: `curl http://localhost:3000/api/auth/register -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","salt":"test"}'`
2. Screenshot of browser console during registration attempt
3. Screenshot of `/debug` page results
4. Terminal output from `npm run dev`

---

**Created:** January 5, 2026
**Last Updated:** January 5, 2026
