import React, { useState } from 'react';
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
      

      
      // Send WhatsApp messages to emergency contacts
      const message = `🚨 EMERGENCY ALERT 🚨\n\nPANIC BUTTON ACTIVATED - Immediate assistance required!\n\nLocation: ${location}${locationLink ? `\nMap: ${locationLink}` : ''}\n\nThis is an automated SafeHaven panic alert.`;
      
      contactsList.forEach((contact, idx) => {
        const number = contact.phone.replace(/[^\d+]/g, '');
        const url = `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(message)}`;
        setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), idx * 300);
      });
      
      setStatus(`Emergency alerts sent to ${contactsList.length} contacts!`);

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
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            resolve(`GPS Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`);
          },
          async (err) => {
            const map = {
              1: 'Location permission denied. Allow access and try again.',
              2: 'Position unavailable. Check network/GPS and try again.',
              3: 'Timeout getting position. Try again.'
            };
            setStatus(map[err && err.code] || 'Unable to get location');
            // Fallback: IP-based approximate location
            try {
              const resp = await fetch('https://ipapi.co/json');
              const data = await resp.json();
              if (data && data.latitude && data.longitude) {
                const approx = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
                resolve(`Approximate Location: ${approx} (${Number(data.latitude).toFixed(6)}, ${Number(data.longitude).toFixed(6)})`);
                return;
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