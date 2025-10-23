const axios = require('axios');
require('dotenv').config();

async function testAuth() {
  console.log('🔐 Testing SMS Portal Authentication...\n');
  console.log('Client ID:', process.env.SMS_PORTAL_CLIENT_ID);
  console.log('Secret:', process.env.SMS_PORTAL_SECRET ? '***' + process.env.SMS_PORTAL_SECRET.slice(-4) : 'NOT SET');
  console.log('');

  try {
    // Try Basic Auth format
    const credentials = Buffer.from(
      `${process.env.SMS_PORTAL_CLIENT_ID}:${process.env.SMS_PORTAL_SECRET}`
    ).toString('base64');
    
    const response = await axios.get(
      'https://rest.smsportal.com/v1/Authentication',
      {
        headers: { 
          'Authorization': `Basic ${credentials}`
        }
      }
    );

    console.log('✅ Authentication successful!');
    console.log('Token:', response.data.token ? '***' + response.data.token.slice(-10) : 'N/A');
    console.log('Expires in:', response.data.expiresIn, 'seconds');
    console.log('\n🎉 Your SMS Portal credentials are working correctly!');
    
  } catch (error) {
    console.error('❌ Authentication failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    console.log('\n💡 Possible issues:');
    console.log('   1. Invalid Client ID or Secret');
    console.log('   2. Account not activated');
    console.log('   3. API access not enabled');
    console.log('   4. Network connectivity issues');
  }
}

testAuth();
