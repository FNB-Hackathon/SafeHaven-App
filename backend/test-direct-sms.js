const axios = require('axios');
require('dotenv').config();

async function testDirectSMS() {
  console.log('📱 Testing Direct SMS Send\n');
  
  const testNumbers = [
    '27843147448',
    '0843147448',
    '+27843147448'
  ];
  
  for (const number of testNumbers) {
    console.log(`\n🔔 Testing number: ${number}`);
    
    try {
      const response = await axios.post(
        'https://api.smsportal.com/api5/http5.aspx',
        null,
        {
          params: {
            Type: 'sendparam',
            Username: process.env.SMS_PORTAL_CLIENT_ID,
            Password: process.env.SMS_PORTAL_SECRET,
            numto: number,
            data1: `SafeHaven Test SMS to ${number}. If you receive this, SMS is working!`
          }
        }
      );
      
      console.log('Response:', response.data);
      console.log('✅ Request sent for', number);
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
  }
  
  console.log('\n📲 Check your phone in 1-2 minutes for SMS delivery.');
  console.log('Note: SMS delivery can take up to 5 minutes depending on network.');
}

testDirectSMS();
