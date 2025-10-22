// routes/panic.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);


router.post('/', (req, res) => {
  client.messages.create({
    body: req.body.message,
    from: process.env.TWILIO_PHONE,
    to: req.body.to,
  })
  .then(message => res.status(200).json({ success: true, sid: message.sid }))
  .catch(error => res.status(500).json({ success: false, error: error.message }));
});

  
module.exports = router;
