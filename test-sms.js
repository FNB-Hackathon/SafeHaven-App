const axios = require('axios');

// Test SMS Portal Integration
async function testSMSIntegration() {
  console.log('🧪 Testing SMS Portal Integration...\n');

  try {
    // Test 1: Send Emergency Alert
    console.log('📱 Test 1: Sending emergency alert...');
    const response = await axios.post('http://localhost:5050/api/panic/alert', {
      phone: '27843147448',
      location: 'Test Location: Pinetown, South Africa (-29.851648, 30.860902)',
      message: 'This is a TEST alert. Please ignore.',
      contacts: [
        { name: 'Test Contact 1', phone: '27843147448' },
        { name: 'Test Contact 2', phone: '27726810755' }
      ]
    });

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    console.log('\n✨ Test completed successfully!');
    console.log('📲 Check your phone for the SMS message.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Verify SMS Portal credentials in backend/.env');
      console.log('   2. Check SMS Portal account balance');
      console.log('   3. Ensure phone numbers include country code (27...)');
      console.log('   4. Check backend/logs for detailed errors');
    }
  }
}

// Run the test
testSMSIntegration();
