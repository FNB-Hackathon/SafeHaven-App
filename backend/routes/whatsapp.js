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
    res.status(200).json({ success: true, sid: whatsappMessage.sid });
  } catch (error) {
    const status = error.status || error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message, code: error.code, moreInfo: error.moreInfo });
  }
});

module.exports = router;