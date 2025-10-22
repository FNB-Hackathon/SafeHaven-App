import React, { useState, useEffect } from 'react';
import './IncidentMap.css';

const IncidentMap = () => {
  const [incidents, setIncidents] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchIncidents();
    getCurrentLocation();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const parseLocation = (locationStr) => {
    if (!locationStr) return null;
    const coords = locationStr.match(/(-?\d+\.?\d*)/g);
    if (coords && coords.length >= 2) {
      return { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) };
    }
    return null;
  };

  return (
    <div className="map-container">
      <h2>Incident Map</h2>
      
      <div className="map-placeholder">
        <div className="map-info">
          <h3>📍 Real-time Incident Locations</h3>
          {userLocation && (
            <div className="user-location">
              <strong>Your Location:</strong> {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
            </div>
          )}
        </div>

        <div className="incidents-on-map">
          {incidents.length === 0 ? (
            <div className="no-incidents">No incidents reported</div>
          ) : (
            incidents.map((incident, index) => {
              const location = parseLocation(incident.location);
              return (
                <div key={index} className="incident-marker">
                  <div className="marker-icon">🚨</div>
                  <div className="incident-details">
                    <strong>{incident.description}</strong>
                    <p>Location: {incident.location}</p>
                    <p>Time: {new Date(incident.created_at).toLocaleString()}</p>
                    {location && (
                      <a 
                        href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-map-btn"
                      >
                        View on Google Maps
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-icon">🚨</span>
          <span>Emergency Incident</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">📍</span>
          <span>Your Location</span>
        </div>
      </div>
    </div>
  );
};

export default IncidentMap;