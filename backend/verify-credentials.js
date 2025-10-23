const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testCredentials(clientId, clientSecret) {
  console.log('\n🔐 Testing credentials...');
  console.log('Client ID:', clientId);
  console.log('Secret:', '***' + clientSecret.slice(-4));
  
  try {
    // Method 1: Basic Auth with GET
    console.log('\n📡 Trying Method 1: Basic Auth with GET...');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await axios.get(
      'https://rest.smsportal.com/v1/Authentication',
      {
        headers: { 
          'Authorization': `Basic ${credentials}`
        }
      }
    );

    console.log('✅ SUCCESS! Authentication worked!');
    console.log('Token received:', response.data.token ? '***' + response.data.token.slice(-10) : 'N/A');
    console.log('Expires in:', response.data.expiresIn, 'seconds');
    return true;
    
  } catch (error) {
    console.log('❌ Method 1 failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    }
  }

  try {
    // Method 2: POST with JSON body
    console.log('\n📡 Trying Method 2: POST with JSON body...');
    const response = await axios.post(
      'https://rest.smsportal.com/v1/authentication',
      {
        clientId: clientId,
        clientSecret: clientSecret
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('✅ SUCCESS! Authentication worked!');
    console.log('Token received:', response.data.token ? '***' + response.data.token.slice(-10) : 'N/A');
    return true;
    
  } catch (error) {
    console.log('❌ Method 2 failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n💡 Both methods failed. Please verify:');
  console.log('   1. Client ID and Secret are correct');
  console.log('   2. API access is enabled in your SMS Portal account');
  console.log('   3. No IP whitelist restrictions');
  console.log('   4. Account is active and verified');
  
  return false;
}

console.log('='.repeat(60));
console.log('SMS Portal Credential Verification Tool');
console.log('='.repeat(60));

rl.question('\nEnter your Client ID: ', (clientId) => {
  rl.question('Enter your Client Secret: ', async (clientSecret) => {
    await testCredentials(clientId.trim(), clientSecret.trim());
    rl.close();
  });
});
