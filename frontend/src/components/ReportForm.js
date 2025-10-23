import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ReportForm.css';

const ReportForm = ({ onReportSubmit }) => {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [incidentType, setIncidentType] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incidentTypes = [
    'General',
    'Harassment',
    'Theft',
    'Assault',
    'Suspicious Activity',
    'Medical Emergency',
    'Fire',
    'Domestic Violence',
    'Stalking',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      await axios.post('/api/reports', {
        description: `[${incidentType}] ${description}`,
        location: location || 'Not specified'
      });

      // Send WhatsApp notification for incident report via native WhatsApp links (no Twilio)
      const envList = process.env.REACT_APP_EMERGENCY_CONTACTS || process.env.REACT_APP_EMERGENCY_CONTACT || '';
      const emergencyContacts = envList
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (emergencyContacts.length > 0) {
        const msg = `📝 ${incidentType.toUpperCase()} INCIDENT: ${description}. Location: ${location || 'Not specified'}. Reported via SafeHaven app.`;
        emergencyContacts.forEach((to, idx) => {
          const number = to.replace(/[^\d+]/g, '');
          const url = `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(msg)}`;
          setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), idx * 300);
        });
      }
      
      setDescription('');
      setLocation('');
      setIncidentType('General');
      onReportSubmit();
    } catch (error) {
      console.error('Error submitting report:', error);
    }
    setIsSubmitting(false);
  };

  const getCurrentLocation = useCallback(async () => {
    // Check for manual override first
    const saved = localStorage.getItem('safehaven_manual_location');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setLocation(`${data.address} (${data.latitude}, ${data.longitude}) ±0m [Manual]`);
        return;
      } catch (e) {
        console.error('Failed to load manual location:', e);
      }
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const res = await navigator.permissions.query({ name: 'geolocation' });
        if (res && res.state === 'denied') {
          // Do not alert; provide best-effort fallback below
        }
      }
    } catch (_) {}

    const tryGoogleGeolocationFallback = async () => {
      try {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return false;
        const geoResp = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`, { method: 'POST' });
        if (!geoResp.ok) return false;
        const geoData = await geoResp.json();
        if (geoData && geoData.location && geoData.location.lat && geoData.location.lng) {
          const { lat, lng } = geoData.location;
          try {
            const address = await getAddressFromCoords(lat, lng);
            const acc = geoData.accuracy || 500;
            setLocation(`${address} (${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}) ±${Math.round(acc)}m [Network]`);
          } catch {
            const acc = geoData.accuracy || 500;
            setLocation(`${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)} ±${Math.round(acc)}m [Network]`);
          }
          return true;
        }
      } catch (_) {}
      return false;
    };

    const tryIpFallback = async () => {
      try {
        const resp = await fetch('https://ipapi.co/json');
        const data = await resp.json();
        if (data) {
          const approx = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
          if (data.latitude && data.longitude) {
            setLocation(`Approximate: ${approx} (${Number(data.latitude).toFixed(6)}, ${Number(data.longitude).toFixed(6)}) [IP]`);
            return true;
          }
          if (approx) {
            setLocation(`Approximate: ${approx}`);
            return true;
          }
        }
      } catch (_) {}
      return false;
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          try {
            const address = await getAddressFromCoords(latitude, longitude);
            setLocation(`${address} (${latitude.toFixed(6)}, ${longitude.toFixed(6)}) ±${Math.round(accuracy)}m [GPS]`);
          } catch {
            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)} ±${Math.round(accuracy)}m [GPS]`);
          }
        },
        async (err) => {
          const ok = await tryGoogleGeolocationFallback();
          if (!ok) {
            const okIp = await tryIpFallback();
            if (!okIp) setLocation('Location unavailable');
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    } else {
      alert('Location not supported');
    }
  }, []);

  useEffect(() => {
  }, []);

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
    <div className="report-form-container">
      <h2>Report Incident</h2>
      <form onSubmit={handleSubmit} className="report-form">
        <select
          value={incidentType}
          onChange={(e) => setIncidentType(e.target.value)}
          className="incident-type-select"
        >
          {incidentTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        
        <textarea
          placeholder="Describe the incident..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        
        <div className="location-input">
          <input
            type="text"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button type="button" onClick={getCurrentLocation} className="location-btn">
            📍
          </button>
        </div>
        
        <button type="submit" disabled={isSubmitting} className="submit-btn">
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default ReportForm;