// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const reportsRouter = require('./routes/reports');
const alertsRouter = require('./routes/alerts');
const panicRouter = require('./routes/panic');
const heatmapRouter = require('./routes/heatmap');
const whatsappRouter = require('./routes/whatsapp');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/reports', reportsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/panic', panicRouter);
app.use('/api/heatmap', heatmapRouter);
app.use('/api/whatsapp', whatsappRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
