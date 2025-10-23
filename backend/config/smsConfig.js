// SMS Portal Configuration
module.exports = {
  clientId: process.env.SMS_PORTAL_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.SMS_PORTAL_SECRET || 'your-client-secret',
  baseUrl: 'https://rest.smsportal.com/v1',
  senderId: 'SafeHaven', // Your registered sender ID
  // Emergency contacts to notify (can be overridden by user settings)
  emergencyContacts: [
    { name: 'Emergency Contact 1', phone: '27843147448' },
    { name: 'Emergency Contact 2', phone: '27726810755' },
    { name: 'Emergency Contact 3', phone: '27722330418' },
    { name: 'Emergency Contact 4', phone: '27796228269' }
  ]
};
