# SMS Portal Integration Guide

## Overview
SafeHaven now supports sending emergency SMS alerts via SMS Portal API. This allows instant notification of emergency contacts when the panic button is activated.

## Setup Instructions

### 1. Get SMS Portal Credentials
1. Sign up at [SMS Portal](https://www.smsportal.com/)
2. Navigate to API settings in your dashboard
3. Create new API credentials
4. Copy your Client ID and Client Secret

### 2. Configure Backend
1. Open `backend/.env` file
2. Update the following variables:
   ```
   SMS_PORTAL_CLIENT_ID=your_actual_client_id
   SMS_PORTAL_SECRET=your_actual_client_secret
   ```

### 3. Configure Frontend
1. Open `frontend/.env` file
2. Update your phone number:
   ```
   REACT_APP_USER_PHONE=+27820000000
   ```
   (Replace with your actual phone number including country code)

### 4. Add Emergency Contacts
You can add emergency contacts in two ways:

#### Option A: Via Settings UI (Recommended)
1. Open the SafeHaven app
2. Click on the **Settings** tab (⚙️)
3. Enter your phone number
4. Add emergency contacts with name and phone number
5. Click "Add Contact" for each contact

#### Option B: Via Configuration File
Edit `backend/config/smsConfig.js`:
```javascript
emergencyContacts: [
  { name: 'John Doe', phone: '27821112222' },
  { name: 'Jane Smith', phone: '27823334444' }
]
```

## Phone Number Format
- **Include country code**: +27 for South Africa
- **Remove spaces and special characters**
- **Examples**:
  - ✅ Correct: `+27820000000` or `27820000000`
  - ❌ Wrong: `082 000 0000`, `(082) 000-0000`

## API Endpoints

### Send Emergency Alert
```
POST /api/panic/alert
```

**Request Body:**
```json
{
  "phone": "27820000000",
  "location": "123 Main St, City (lat, lng)",
  "message": "Additional emergency info",
  "contacts": [
    { "name": "Contact Name", "phone": "27821112222" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "contact": "Contact Name",
      "success": true,
      "messageId": "abc123"
    }
  ],
  "message": "Emergency alerts sent successfully"
}
```

### Send Single SMS
```
POST /api/panic
```

**Request Body:**
```json
{
  "to": "27820000000",
  "message": "Your SMS message here"
}
```

## Testing

### Test SMS Sending
You can test the SMS functionality using curl or Postman:

```bash
curl -X POST http://localhost:5050/api/panic/alert \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "27820000000",
    "location": "Test Location (lat, lng)",
    "message": "This is a test alert",
    "contacts": [
      { "name": "Test Contact", "phone": "27821112222" }
    ]
  }'
```

### Test from Frontend
1. Open the app in your browser
2. Go to Settings and add a test contact
3. Return to Home
4. Click the PANIC button
5. Check if SMS was sent

## SMS Message Format
When the panic button is activated, contacts receive:

```
🚨 EMERGENCY ALERT 🚨

User +27820000000 needs help!
📍 Location: [Address/Coordinates]
🕒 Time: [Current Date/Time]
ℹ️ Additional Info: [Optional Message]

Please respond immediately.
```

## Troubleshooting

### SMS Not Sending
1. **Check credentials**: Verify Client ID and Secret in `.env`
2. **Check SMS Portal balance**: Ensure you have sufficient credits
3. **Check phone number format**: Must include country code
4. **Check backend logs**: Look for authentication errors

### Authentication Failed
- Verify credentials are correct
- Check if account is active on SMS Portal
- Ensure API access is enabled in your SMS Portal account

### Invalid Phone Number
- Remove all spaces and special characters
- Include country code (e.g., 27 for South Africa)
- Example: `27820000000` not `082 000 0000`

## Rate Limits
- SMS Portal has rate limits based on your plan
- The service automatically handles token refresh
- For high-volume usage, contact SMS Portal for enterprise plans

## Cost Considerations
- Each SMS sent incurs a cost based on SMS Portal pricing
- Test with a small number of contacts first
- Monitor your SMS Portal dashboard for usage

## Security Best Practices
1. **Never commit credentials**: Keep `.env` files out of version control
2. **Use environment variables**: Store sensitive data in `.env` files
3. **Restrict API access**: Use IP whitelisting if available
4. **Monitor usage**: Regularly check SMS Portal dashboard for unusual activity

## Support
- SMS Portal Documentation: https://www.smsportal.com/docs
- SafeHaven Support: Contact your development team

## Next Steps
1. Set up SMS Portal account and get credentials
2. Configure environment variables
3. Add emergency contacts via Settings page
4. Test the panic button functionality
5. Verify SMS delivery to all contacts
