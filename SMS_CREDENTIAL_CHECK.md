# SMS Portal Credential Verification Guide

## How to Find Your Correct Credentials

1. **Log in to SMS Portal**
   - Go to: https://www.smsportal.com/
   - Log in with your account

2. **Navigate to API Settings**
   - Click on your **Profile/Account** icon
   - Go to **Settings** or **API Settings**
   - Look for **API Credentials** or **Integration Settings**

3. **Copy the Exact Values**
   You need two pieces of information:
   - **Client ID** (also called API Key or Account ID)
   - **Client Secret** (also called API Secret or Password)

## Current Values in Your System

```
Client ID: 4e5a5efe-2bc0-45ad-a5a9-9ce5523cd56a
Secret: ccfd7725-68d2-4d47-9d87-2742d6eaf199
```

## Common Issues

### Issue 1: Wrong Credentials Type
SMS Portal may have different types of credentials:
- **Account credentials** (for logging in)
- **API credentials** (for programmatic access)
- **Integration keys** (for third-party apps)

Make sure you're using the **API credentials** specifically.

### Issue 2: API Not Enabled
- Check if REST API access is enabled for your account
- Some plans require activation of API features
- Contact SMS Portal support if API option is not visible

### Issue 3: IP Whitelisting
- Some accounts require IP whitelisting
- Check if your current IP needs to be added to allowed list

### Issue 4: Account Verification
- Ensure account email is verified
- Check if there are any pending verification steps
- Verify payment method is active

## Alternative: Check SMS Portal Documentation

Visit SMS Portal's official documentation:
- https://www.smsportal.com/docs/
- Look for "Authentication" or "Getting Started"
- Check for any recent API changes

## Test Authentication Manually

You can test your credentials using curl:

```bash
# Replace with your actual credentials
CLIENT_ID="your-client-id"
SECRET="your-secret"

# Test authentication
curl -X GET "https://rest.smsportal.com/v1/Authentication" \
  -H "Authorization: Basic $(echo -n "$CLIENT_ID:$SECRET" | base64)"
```

If this works, you'll see a response with a token.
If it fails, the credentials are incorrect or API access is not enabled.

## Next Steps

1. Log in to SMS Portal dashboard
2. Find the exact API credentials
3. Update the credentials in `backend/.env`:
   ```
   SMS_PORTAL_CLIENT_ID=your_actual_client_id
   SMS_PORTAL_SECRET=your_actual_secret
   ```
4. Restart the backend: `cd backend && npm start`
5. Test again

## Need Help?

Contact SMS Portal support:
- Email: support@smsportal.com
- Phone: Check their website for support number
- Ask specifically about: "REST API credentials for programmatic SMS sending"
