// routes/heatmap.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const geoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [28.0, -26.0],
        },
        properties: {
          alert: 'Incident reported',
        },
      },
    ],
  };
  res.json(geoJSON);
});

module.exports = router;
