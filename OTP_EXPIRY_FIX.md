# 🔐 OTP EXPIRY CONFIGURATION FIX

**Issue Found:** 2026-03-28 20:50 UTC
**Message:** "OTP expiry exceeds recommended threshold"
**Recommendation:** Change OTP expiry from >1 hour to <1 hour (e.g., 15-30 minutes)

---

## CURRENT STATE

- **Project:** TurnoSmart (povgwdbnyqdcygedcijl)
- **Provider:** Email (Magic Link)
- **Current OTP Expiry:** Unknown (likely 24 hours by default)
- **Recommended:** 15-30 minutes max

---

## HOW TO FIX

### Option 1: Via Supabase CLI (Recommended)

The OTP expiry setting is not visible in the Dashboard UI, but can be configured via the Supabase Management API or CLI.

```bash
# 1. Get your Supabase project details
cd ~/desarrollo/TurnoSmart-local
supabase status

# 2. Create/update auth config via PostgreSQL directly
# Connect to your Supabase database and run:
```

**SQL Option (Direct database):**
```sql
-- Note: This requires direct DB access or managing through Supabase API
-- OTP expiry is typically stored in auth.config

-- Update via API is preferred (see Option 2)
```

### Option 2: Via Supabase Management API (Best)

Use Supabase Management API with your service role key to update the project settings:

```bash
#!/bin/bash

PROJECT_ID="povgwdbnyqdcygedcijl"
SERVICE_ROLE_KEY="<your-service-role-key>"  # Get from: Dashboard → Settings → API
MANAGEMENT_API_KEY="<your-management-api-key>"  # From: https://supabase.com/dashboard/account/tokens

# Update OTP expiry to 15 minutes (900 seconds)
curl -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_ID}/auth/config" \
  -H "Authorization: Bearer ${MANAGEMENT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "external": {
      "email": {
        "enabled": true,
        "otp_exp": 900
      }
    }
  }'
```

### Option 3: Via Supabase Dashboard (Manual - Once Fixed)

Once the OTP field appears in the dashboard (after Supabase resolves any UI issues):
1. Go to: **Auth → Sign In / Providers**
2. Click the **Email** provider settings
3. Look for **OTP Expiration Time**
4. Change from current value to: **15 minutes** (or up to 59 minutes)
5. Save changes

---

## RECOMMENDED VALUES

| Setting | Value | Reason |
|---------|-------|--------|
| **OTP Expiry** | 15-30 minutes | Security best practice; balance UX and security |
| **Magic Link Format** | Email link (not SMS) | Appropriate for web app |
| **Delivery Service** | Postmark SMTP | Better than Supabase built-in |

---

## SECURITY IMPLICATIONS

**Current (>1 hour):**
- ❌ Too long – increases brute force window
- ❌ Tokens can be shared/leaked for extended period
- ⚠️ Non-compliant with production security guidelines

**Recommended (15-30 minutes):**
- ✅ Tight security window
- ✅ User can still click link if they don't delay
- ✅ Complies with OWASP/security best practices
- ✅ Reduces exposure of leaked tokens

---

## NEXT STEPS

1. **Immediate (Today):**
   - Use Management API (Option 2) to set OTP expiry to 900 seconds (15 minutes)
   - Verify change took effect

2. **Short-term (This week):**
   - Monitor if users have issues clicking magic links within 15 min
   - Adjust if needed (max 59 minutes, still under 1 hour)
   - Document final value in project wiki

3. **Production (Before launch):**
   - Ensure OTP expiry is set and monitored
   - Add logging for OTP generation/expiry
   - Set up alerts for high OTP expiry/reuse

---

## VERIFICATION AFTER FIX

Once you apply the fix, Supabase should:
1. Stop showing the OTP expiry warning
2. Enforce the new expiry time on all newly generated OTP tokens
3. Log the configuration change in audit logs

**To verify:**
- Go back to: **Auth → Sign In / Providers**
- The "OTP expiry exceeds recommended threshold" alert should disappear ✅

---

**Config File:** None (API-managed setting)
**Requires:** Management API Key or Service Role Key
**Estimated Time:** 5 minutes to fix
**Risk Level:** ✅ Low (just changes timing of OTP tokens)
