const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

router.post('/', async (req, res) => {
  try {
    const { message, to } = req.body;
    
    const whatsappMessage = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });

    res.json({ success: true, sid: whatsappMessage.sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;