const axios = require('axios');
const smsConfig = require('../config/smsConfig');
const xml2js = require('xml2js');

class SMSService {
  constructor() {
    // HTTP API doesn't need token-based authentication
    this.httpApiUrl = 'https://api.smsportal.com/api5/http5.aspx';
  }

  async sendSMS(phoneNumber, message) {
    try {
      console.log(`Sending SMS to ${phoneNumber}...`);
      
      const response = await axios.post(
        this.httpApiUrl,
        null,
        {
          params: {
            Type: 'sendparam',
            Username: smsConfig.clientId,
            Password: smsConfig.clientSecret,
            numto: phoneNumber,
            data1: message
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
        console.log(`✅ SMS sent successfully. Event ID: ${eventId}`);
        return {
          success: true,
          messageId: eventId,
          status: 'Message submitted successfully'
        };
      } else {
        console.error(`❌ SMS failed: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg || 'Failed to send SMS',
          status: 'Failed'
        };
      }
    } catch (error) {
      console.error('SMS Sending Error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
        status: 'Failed'
      };
    }
  }

  async sendEmergencyAlert(userLocation, userPhone, additionalInfo = '', contacts = null) {
    try {
      const message = `🚨 EMERGENCY ALERT 🚨\n\n` +
        `User ${userPhone} needs help!\n` +
        `📍 Location: ${userLocation || 'Location not available'}\n` +
        `🕒 Time: ${new Date().toLocaleString()}\n` +
        `${additionalInfo ? `ℹ️ Additional Info: ${additionalInfo}\n` : ''}\n` +
        `Please respond immediately.`;

      // Use provided contacts or fall back to config
      const contactsToUse = contacts || smsConfig.emergencyContacts;
      
      if (!contactsToUse || contactsToUse.length === 0) {
        return {
          success: false,
          error: 'No emergency contacts configured'
        };
      }

      // Send to all emergency contacts
      const results = [];
      for (const contact of contactsToUse) {
        const result = await this.sendSMS(contact.phone, message);
        results.push({
          contact: contact.name || contact.phone,
          success: result.success,
          messageId: result.messageId
        });
      }

      return {
        success: results.some(r => r.success),
        results
      };
    } catch (error) {
      console.error('Emergency Alert Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SMSService();
