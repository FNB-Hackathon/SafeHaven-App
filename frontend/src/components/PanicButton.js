import React, { useState } from 'react';
import axios from 'axios';
import './PanicButton.css';

const PanicButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [status, setStatus] = useState('');

  const handlePanic = async () => {
    setIsPressed(true);
    setStatus('Sending emergency alert...');

    try {
      const location = await getCurrentLocation();
      const buildLocationLink = (loc) => {
        if (!loc) return '';
        const m = loc.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (m) {
          const lat = m[1];
          const lng = m[2];
          return `https://www.google.com/maps?q=${lat},${lng}`;
        }
        const q = loc.replace(/^Approximate:\s*/i, '').trim();
        return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
      };
      const locationLink = buildLocationLink(location);
      
      // Get emergency contacts from environment or localStorage
      const envList = process.env.REACT_APP_EMERGENCY_CONTACTS || process.env.REACT_APP_EMERGENCY_CONTACT || '';
      const emergencyContacts = envList
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      
      // Try to get contacts from localStorage
      const savedContacts = localStorage.getItem('safehaven_emergency_contacts');
      let contactsList = [];
      
      if (savedContacts) {
        try {
          contactsList = JSON.parse(savedContacts);
        } catch (e) {
          console.error('Failed to parse saved contacts:', e);
        }
      } else if (emergencyContacts.length > 0) {
        // Convert environment contacts to proper format
        contactsList = emergencyContacts.map(contact => ({
          phone: contact.replace(/[^\d+]/g, ''),
          name: contact
        }));
      }
      
      if (contactsList.length === 0) {
        setStatus('No emergency contacts configured. Add contacts in Settings.');
        setTimeout(() => {
          setIsPressed(false);
          setStatus('');
        }, 3000);
        return;
      }
      
      // Get user's phone number from localStorage or environment
      const userPhone = localStorage.getItem('safehaven_user_phone') || 
                       process.env.REACT_APP_USER_PHONE || 
                       'Unknown';
      
      // Format location with link
      const locationWithLink = locationLink 
        ? `${location}\nMap: ${locationLink}` 
        : location;
      
      // Send SMS alerts via backend
      const smsResponse = await axios.post('/api/panic/alert', {
        phone: userPhone,
        location: locationWithLink,
        message: 'PANIC BUTTON ACTIVATED - Immediate assistance required!',
        contacts: contactsList
      });
      
      if (smsResponse.data.success) {
        setStatus('SMS alerts sent successfully!');
      } else {
        setStatus('Some SMS alerts failed to send.');
      }
      
      // Also send WhatsApp messages (as backup/additional channel)
      const message = `🚨 EMERGENCY ALERT: Help needed at ${location}. ${locationLink ? `Map: ${locationLink}. ` : ''}This is an automated SafeHaven panic alert.`;
      emergencyContacts.forEach((contact, idx) => {
        const number = contact.replace(/[^\d+]/g, '');
        const url = `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(message)}`;
        setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), idx * 300);
      });

      // Create incident report
      await axios.post('/api/reports', {
        description: 'Emergency panic button activated',
        location: location
      });

      setTimeout(() => {
        setIsPressed(false);
        setStatus('');
      }, 3000);

    } catch (error) {
      console.error('Error sending panic alert:', error);
      const msg = (error && error.response && error.response.data && error.response.data.error)
        || (error && error.message)
        || 'Failed to send alert. Please try again.';
      setStatus(msg);
      setTimeout(() => {
        setIsPressed(false);
        setStatus('');
      }, 3000);
    }
  };

  const getCurrentLocation = async () => {
    // Check for manual override first
    const saved = localStorage.getItem('safehaven_manual_location');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return `${data.address} (${data.latitude}, ${data.longitude}) ±0m [Manual]`;
      } catch (e) {
        console.error('Failed to load manual location:', e);
      }
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const res = await navigator.permissions.query({ name: 'geolocation' });
        if (res && res.state === 'denied') {
          setStatus('Location permission denied. Enable it in your browser settings and try again.');
          return 'Location permission denied';
        }
      }
    } catch (_) {}

    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            try {
              const address = await getAddressFromCoords(latitude, longitude);
              resolve(`${address} (${latitude.toFixed(6)}, ${longitude.toFixed(6)}) ±${Math.round(accuracy)}m [GPS]`);
            } catch {
              resolve(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)} ±${Math.round(accuracy)}m [GPS]`);
            }
          },
          async (err) => {
            const map = {
              1: 'Location permission denied. Allow access and try again.',
              2: 'Position unavailable. Check network/GPS and try again.',
              3: 'Timeout getting position. Try again.'
            };
            setStatus(map[err && err.code] || 'Unable to get location');
            // Fallback 1: Google Geolocation API (network-based lat/lng)
            try {
              const geoResp = await fetch(
                `https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`,
                { method: 'POST' }
              );
              if (geoResp.ok) {
                const geoData = await geoResp.json();
                if (geoData && geoData.location && geoData.location.lat && geoData.location.lng) {
                  const { lat, lng } = geoData.location;
                  try {
                    const address = await getAddressFromCoords(lat, lng);
                    const acc = geoData.accuracy || 500;
                    resolve(`${address} (${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}) ±${Math.round(acc)}m [Network]`);
                    return;
                  } catch (_) {
                    const acc = geoData.accuracy || 500;
                    resolve(`${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)} ±${Math.round(acc)}m [Network]`);
                    return;
                  }
                }
              }
            } catch (_) {}

            // Fallback 2: IP-based approximate location
            try {
              const resp = await fetch('https://ipapi.co/json');
              const data = await resp.json();
              if (data) {
                const approx = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
                if (data.latitude && data.longitude) {
                  resolve(`Approximate: ${approx} (${Number(data.latitude).toFixed(6)}, ${Number(data.longitude).toFixed(6)}) [IP]`);
                  return;
                }
                if (approx) {
                  resolve(`Approximate: ${approx}`);
                  return;
                }
              }
            } catch (_) {}
            resolve('Location unavailable');
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
      } else {
        setStatus('Location not supported');
        resolve('Location not supported');
      }
    });
  };

  const getAddressFromCoords = async (lat, lng) => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error('No API key');
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.results && data.results[0]) {
      return data.results[0].formatted_address;
    }
    throw new Error('No address found');
  };

  return (
    <div className="panic-container">
      <button 
        className={`panic-button ${isPressed ? 'pressed' : ''}`}
        onClick={handlePanic}
        disabled={isPressed}
      >
        {isPressed ? 'SENDING...' : 'PANIC'}
      </button>
      {status && <div className="status-message">{status}</div>}
      <p className="panic-info">Press in case of emergency</p>
    </div>
  );
};

export default PanicButton;