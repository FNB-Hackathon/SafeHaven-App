// routes/panic.js
const express = require('express');
const router = express.Router();
const smsService = require('../services/smsService');

/**
 * @route POST /panic/alert
 * @desc Send emergency alert via SMS
 * @access Public
 * @body {
 *   phone: string,      // User's phone number
 *   location: string,   // User's location
 *   message: string,    // Additional message (optional)
 *   contacts: array     // Array of {name, phone} objects (optional)
 * }
 */
router.post('/alert', async (req, res) => {
  try {
    const { phone, location, message, contacts } = req.body;
    
    if (!phone || !location) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and location are required'
      });
    }

    // If custom contacts are provided, use them; otherwise, use default from config
    let contactsToUse = contacts;
    
    if (contacts && Array.isArray(contacts)) {
      // Validate contacts format
      const validContacts = contacts.every(contact => 
        contact.phone && typeof contact.phone === 'string'
      );
      
      if (!validContacts) {
        return res.status(400).json({
          success: false,
          error: 'Invalid contacts format. Each contact must have a phone number.'
        });
      }
    } else {
      // Use default contacts from config
      const smsConfig = require('../config/smsConfig');
      contactsToUse = smsConfig.emergencyContacts;
    }

    // Send emergency alerts
    const result = await smsService.sendEmergencyAlert(location, phone, message, contactsToUse);
    
    res.status(200).json({
      success: result.success,
      results: result.results,
      message: 'Emergency alerts sent successfully'
    });
    
  } catch (error) {
    console.error('Panic Alert Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send emergency alerts',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Legacy Twilio endpoint (kept for backward compatibility)
router.post('/', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Recipient and message are required'
      });
    }
    
    // Forward to SMS Portal service
    const result = await smsService.sendSMS(to, message);
    
    if (result.success) {
      res.status(200).json({ 
        success: true, 
        messageId: result.messageId,
        status: 'Message submitted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send message'
      });
    }
  } catch (error) {
    console.error('SMS Sending Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    });
  }
});

module.exports = router;
