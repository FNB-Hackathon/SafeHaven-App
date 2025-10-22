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

      // Send WhatsApp notification for incident report
      await axios.post('/api/whatsapp', {
        message: `📝 ${incidentType.toUpperCase()} INCIDENT: ${description}. Location: ${location || 'Not specified'}. Reported via SafeHaven app.`,
        to: process.env.REACT_APP_EMERGENCY_CONTACT || '+1234567890'
      });
      
      setDescription('');
      setLocation('');
      setIncidentType('General');
      onReportSubmit();
    } catch (error) {
      console.error('Error submitting report:', error);
    }
    setIsSubmitting(false);
  };

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const address = await getAddressFromCoords(latitude, longitude);
            setLocation(`${address} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
          } catch {
            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        },
        () => {
          alert('Unable to get location');
        }
      );
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

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