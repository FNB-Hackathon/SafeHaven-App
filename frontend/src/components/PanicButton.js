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
      const emergencyContacts = ['+27722330418', '+27614861915', '+27731234567'];
      
      // Send SMS to all emergency contacts
      const smsPromises = emergencyContacts.map(contact => 
        axios.post('/api/panic', {
          message: `🚨 EMERGENCY ALERT: Help needed at ${location}. This is an automated SafeHaven panic alert.`,
          to: contact
        })
      );
      
      await Promise.all(smsPromises);

      // Create incident report
      await axios.post('/api/reports', {
        description: 'Emergency panic button activated',
        location: location
      });

      setStatus('Emergency alert sent successfully!');
      setTimeout(() => {
        setIsPressed(false);
        setStatus('');
      }, 3000);

    } catch (error) {
      console.error('Error sending panic alert:', error);
      setStatus('Failed to send alert. Please try again.');
      setTimeout(() => {
        setIsPressed(false);
        setStatus('');
      }, 3000);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const address = await getAddressFromCoords(latitude, longitude);
              resolve(`${address} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
            } catch {
              resolve(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
            }
          },
          () => {
            resolve('Location unavailable');
          }
        );
      } else {
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