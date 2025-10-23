const axios = require('axios');
require('dotenv').config();

const clientId = process.env.SMS_PORTAL_CLIENT_ID;
const clientSecret = process.env.SMS_PORTAL_SECRET;

async function testHTTPAPI() {
  console.log('🔐 Testing SMS Portal HTTP API\n');
  console.log('Client ID:', clientId);
  console.log('Secret:', '***' + clientSecret.slice(-6));
  console.log('='.repeat(60));

  // HTTP API typically uses direct parameters or simple auth
  try {
    console.log('\n📡 Testing HTTP API - Send SMS');
    
    const response = await axios.post(
      'https://api.smsportal.com/api5/http5.aspx',
      null,
      {
        params: {
          Type: 'sendparam',
          Username: clientId,
          Password: clientSecret,
          numto: '27843147448', // Test number
          data1: 'Test message from SafeHaven - Please ignore'
        }
      }
    );
    
    console.log('✅ HTTP API Response:');
    console.log(response.data);
    return true;
    
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  // Try alternative HTTP endpoint
  try {
    console.log('\n📡 Testing Alternative HTTP API endpoint');
    
    const response = await axios.get(
      'https://www.smsportal.com/api/send',
      {
        params: {
          key: clientId,
          secret: clientSecret,
          to: '27843147448',
          message: 'Test from SafeHaven'
        }
      }
    );
    
    console.log('✅ Response:');
    console.log(response.data);
    return true;
    
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  console.log('\n💡 If both failed, we need to check SMS Portal documentation for HTTP API');
}

testHTTPAPI();
