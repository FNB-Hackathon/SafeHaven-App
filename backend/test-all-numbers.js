const axios = require('axios');
const xml2js = require('xml2js');
require('dotenv').config();

async function testAllNumbers() {
  console.log('📱 Testing SMS to All Numbers\n');
  console.log('='.repeat(60));
  
  const numbers = [
    '27614861915',
    '27722330418',
    '27726810755',
    '27796228269',
    '27838829990',
    '27843147448'
  ];
  
  const results = [];
  
  for (const number of numbers) {
    console.log(`\n📤 Sending SMS to ${number}...`);
    
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
            data1: `🚨 SafeHaven TEST: This is a test SMS alert. If you receive this, SMS is working! Reply to confirm.`
          }
        }
      );
      
      // Parse XML response
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      
      const eventId = result.api_result?.send_info?.[0]?.eventid?.[0];
      const isSuccess = result.api_result?.call_result?.[0]?.result?.[0] === 'True';
      const errorMsg = result.api_result?.call_result?.[0]?.error?.[0];
      
      if (isSuccess) {
        console.log(`   ✅ Success - Event ID: ${eventId}`);
        results.push({ number, status: 'Sent', eventId });
      } else {
        console.log(`   ❌ Failed - ${errorMsg}`);
        results.push({ number, status: 'Failed', error: errorMsg });
      }
      
      // Small delay between sends
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({ number, status: 'Error', error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:\n');
  results.forEach(r => {
    console.log(`${r.number}: ${r.status}${r.eventId ? ' (Event: ' + r.eventId + ')' : ''}`);
  });
  
  console.log('\n📲 Important Notes:');
  console.log('   1. SMS can take 1-5 minutes to deliver');
  console.log('   2. Check SMS Portal dashboard for delivery status');
  console.log('   3. Verify your SMS credits are sufficient');
  console.log('   4. Some carriers may block automated SMS');
  console.log('\n🔍 To check delivery status:');
  console.log('   - Login to https://www.smsportal.com/');
  console.log('   - Go to Reports → Message History');
  console.log('   - Search for the Event IDs listed above');
}

testAllNumbers();
