const axios = require('axios');
require('dotenv').config();

const clientId = process.env.SMS_PORTAL_CLIENT_ID;
const clientSecret = process.env.SMS_PORTAL_SECRET;

async function testAllMethods() {
  console.log('🔐 Testing SMS Portal Authentication with Multiple Methods\n');
  console.log('Client ID:', clientId);
  console.log('Secret:', '***' + clientSecret.slice(-6));
  console.log('='.repeat(60));

  // Method 1: Basic Auth with GET on /Authentication
  try {
    console.log('\n📡 Method 1: Basic Auth GET /Authentication');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.get(
      'https://rest.smsportal.com/v1/Authentication',
      { headers: { 'Authorization': `Basic ${credentials}` } }
    );
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  // Method 2: Basic Auth with GET on /authentication (lowercase)
  try {
    console.log('\n📡 Method 2: Basic Auth GET /authentication (lowercase)');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.get(
      'https://rest.smsportal.com/v1/authentication',
      { headers: { 'Authorization': `Basic ${credentials}` } }
    );
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  // Method 3: POST with JSON body
  try {
    console.log('\n📡 Method 3: POST JSON /authentication');
    const response = await axios.post(
      'https://rest.smsportal.com/v1/authentication',
      { clientId, clientSecret },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  // Method 4: Header-based auth
  try {
    console.log('\n📡 Method 4: Header-based authentication');
    const response = await axios.get(
      'https://rest.smsportal.com/v1/Authentication',
      { 
        headers: { 
          'ClientId': clientId,
          'ClientSecret': clientSecret
        } 
      }
    );
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  // Method 5: Query parameters
  try {
    console.log('\n📡 Method 5: Query parameters');
    const response = await axios.get(
      `https://rest.smsportal.com/v1/Authentication?clientId=${encodeURIComponent(clientId)}&clientSecret=${encodeURIComponent(clientSecret)}`
    );
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  console.log('\n💡 All methods failed. Please:');
  console.log('   1. Verify credentials are copied correctly from SMS Portal dashboard');
  console.log('   2. Check if API access is enabled');
  console.log('   3. Contact SMS Portal support for the correct API authentication method');
}

testAllMethods();
