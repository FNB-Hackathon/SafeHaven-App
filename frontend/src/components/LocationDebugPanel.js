import React, { useState, useEffect } from 'react';
import './LocationDebugPanel.css';

const LocationDebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState({
    permission: 'checking...',
    method: 'none',
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    error: null,
    address: 'loading...'
  });
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualMode, setManualMode] = useState(false);

  const getAddressFromCoords = async (lat, lng) => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return 'No API key';
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.results && data.results[0]) {
        return data.results[0].formatted_address;
      }
      return 'Address not found';
    } catch {
      return 'Geocoding failed';
    }
  };

  useEffect(() => {
    let watchId = null;

    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setDebugInfo(prev => ({ ...prev, permission: result.state }));
          
          result.addEventListener('change', () => {
            setDebugInfo(prev => ({ ...prev, permission: result.state }));
          });
        } else {
          setDebugInfo(prev => ({ ...prev, permission: 'unknown' }));
        }
      } catch (err) {
        setDebugInfo(prev => ({ ...prev, permission: 'error checking' }));
      }
    };

    const startWatching = () => {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const address = await getAddressFromCoords(latitude, longitude);
            setDebugInfo({
              permission: 'granted',
              method: 'GPS',
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6),
              accuracy: Math.round(accuracy),
              timestamp: new Date(position.timestamp).toLocaleTimeString(),
              error: null,
              address
            });
          },
          async (error) => {
            setDebugInfo(prev => ({
              ...prev,
              error: `GPS Error (${error.code}): ${error.message}. Trying fallbacks...`,
              method: 'GPS Failed - Trying Network...'
            }));

            // Try Google Geolocation API fallback
            try {
              const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
              if (!apiKey) {
                throw new Error('No API key');
              }
              
              const geoResp = await fetch(
                `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
                { method: 'POST' }
              );
              
              if (!geoResp.ok) {
                const errText = await geoResp.text();
                throw new Error(`Google API error: ${geoResp.status} - ${errText}`);
              }
              
              const geoData = await geoResp.json();
              if (geoData && geoData.location) {
                const { lat, lng } = geoData.location;
                const acc = geoData.accuracy || 500;
                const address = await getAddressFromCoords(lat, lng);
                setDebugInfo(prev => ({
                  permission: prev.permission,
                  method: 'Network (Google API)',
                  latitude: Number(lat).toFixed(6),
                  longitude: Number(lng).toFixed(6),
                  accuracy: Math.round(acc),
                  timestamp: new Date().toLocaleTimeString(),
                  error: 'GPS unavailable, using network location',
                  address
                }));
                return;
              }
            } catch (e) {
              console.error('Network fallback failed:', e);
              setDebugInfo(prev => ({
                ...prev,
                error: `GPS Error (${error.code}). Network fallback failed: ${e.message}. Trying IP...`,
                method: 'Network Failed - Trying IP...'
              }));
            }

            // Try IP fallback
            try {
              const resp = await fetch('https://ipapi.co/json');
              const data = await resp.json();
              if (data && data.latitude && data.longitude) {
                const approx = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
                setDebugInfo(prev => ({
                  permission: prev.permission,
                  method: 'IP-based',
                  latitude: Number(data.latitude).toFixed(6),
                  longitude: Number(data.longitude).toFixed(6),
                  accuracy: '~5000+',
                  timestamp: new Date().toLocaleTimeString(),
                  error: 'GPS and Network unavailable, using IP location',
                  address: `Approximate: ${approx}`
                }));
              }
            } catch (e) {
              console.error('IP fallback failed:', e);
              setDebugInfo(prev => ({
                ...prev,
                error: `All location methods failed. GPS: ${error.message}, Network: failed, IP: ${e.message}`,
                method: 'All Failed',
                address: 'Location unavailable'
              }));
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000
          }
        );
      } else {
        setDebugInfo(prev => ({
          ...prev,
          error: 'Geolocation not supported by this browser',
          method: 'Not supported'
        }));
      }
    };

    checkPermission();
    startWatching();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const getStatusColor = () => {
    if (debugInfo.method === 'Manual Override') return '#2196f3';
    if (debugInfo.method === 'GPS') return '#4caf50';
    if (debugInfo.method.includes('Network')) return '#ff9800';
    if (debugInfo.method.includes('IP')) return '#f44336';
    return '#9e9e9e';
  };

  const handleSetManual = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude');
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Coordinates out of range. Lat: -90 to 90, Lng: -180 to 180');
      return;
    }

    const address = await getAddressFromCoords(lat, lng);
    
    const manualData = {
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      accuracy: 0,
      timestamp: new Date().toISOString(),
      address
    };
    
    localStorage.setItem('safehaven_manual_location', JSON.stringify(manualData));
    
    setDebugInfo({
      permission: 'granted',
      method: 'Manual Override',
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      accuracy: 0,
      timestamp: new Date().toLocaleTimeString(),
      error: null,
      address
    });
    
    setManualMode(true);
    alert('Manual location set! All emergency alerts will use these coordinates.');
  };

  const handleClearManual = () => {
    localStorage.removeItem('safehaven_manual_location');
    setManualMode(false);
    setManualLat('');
    setManualLng('');
    alert('Manual location cleared. Returning to automatic detection.');
    window.location.reload();
  };

  useEffect(() => {
    const saved = localStorage.getItem('safehaven_manual_location');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setDebugInfo({
          permission: 'granted',
          method: 'Manual Override',
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          timestamp: new Date(data.timestamp).toLocaleTimeString(),
          error: null,
          address: data.address
        });
        setManualMode(true);
        setManualLat(data.latitude);
        setManualLng(data.longitude);
      } catch (e) {
        console.error('Failed to load manual location:', e);
      }
    }
  }, []);

  return (
    <div className="location-debug-panel">
      <h3>🔍 Live Location Debug</h3>
      
      <div className="debug-grid">
        <div className="debug-item">
          <span className="debug-label">Permission:</span>
          <span className={`debug-value permission-${debugInfo.permission}`}>
            {debugInfo.permission}
          </span>
        </div>

        <div className="debug-item">
          <span className="debug-label">Method:</span>
          <span 
            className="debug-value method-badge"
            style={{ backgroundColor: getStatusColor() }}
          >
            {debugInfo.method}
          </span>
        </div>

        <div className="debug-item">
          <span className="debug-label">Latitude:</span>
          <span className="debug-value">{debugInfo.latitude || 'N/A'}</span>
        </div>

        <div className="debug-item">
          <span className="debug-label">Longitude:</span>
          <span className="debug-value">{debugInfo.longitude || 'N/A'}</span>
        </div>

        <div className="debug-item">
          <span className="debug-label">Accuracy:</span>
          <span className="debug-value">
            {debugInfo.accuracy ? `±${debugInfo.accuracy}m` : 'N/A'}
          </span>
        </div>

        <div className="debug-item">
          <span className="debug-label">Last Update:</span>
          <span className="debug-value">{debugInfo.timestamp || 'N/A'}</span>
        </div>
      </div>

      {debugInfo.address && (
        <div className="debug-address">
          <span className="debug-label">Address:</span>
          <div className="debug-address-text">{debugInfo.address}</div>
        </div>
      )}

      {debugInfo.error && (
        <div className="debug-error">
          ⚠️ {debugInfo.error}
        </div>
      )}

      {debugInfo.latitude && debugInfo.longitude && (
        <div className="debug-map-link">
          <a
            href={`https://www.google.com/maps?q=${debugInfo.latitude},${debugInfo.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📍 View on Google Maps
          </a>
        </div>
      )}

      <div className="manual-override-section">
        <h4>📍 Manual Location Override</h4>
        {!manualMode ? (
          <div className="manual-inputs">
            <input
              type="number"
              step="0.000001"
              placeholder="Latitude (e.g., -29.844890)"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="coord-input"
            />
            <input
              type="number"
              step="0.000001"
              placeholder="Longitude (e.g., 30.864981)"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="coord-input"
            />
            <button onClick={handleSetManual} className="manual-btn set-btn">
              Set Manual Location
            </button>
          </div>
        ) : (
          <div className="manual-active">
            <p>✅ Manual location is active. All alerts will use your coordinates.</p>
            <button onClick={handleClearManual} className="manual-btn clear-btn">
              Clear & Use Auto-Detection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationDebugPanel;
