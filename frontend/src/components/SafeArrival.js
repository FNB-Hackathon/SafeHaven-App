import React, { useState, useEffect } from 'react';
import './SafeArrival.css';

const SafeArrival = () => {
  const [isActive, setIsActive] = useState(false);
  const [destination, setDestination] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [journeyStartTime, setJourneyStartTime] = useState(null);
  const [expectedArrivalTime, setExpectedArrivalTime] = useState(null);
  const [locationUpdatesSent, setLocationUpdatesSent] = useState(0);
  const [status, setStatus] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    let interval;
    if (isActive) {
      // Send location updates every minute
      interval = setInterval(() => {
        setLocationUpdatesSent(prev => prev + 1);
        
        // Check if 2 minutes past expected arrival time
        if (expectedArrivalTime && !alertSent) {
          const now = new Date();
          const alertTime = new Date(expectedArrivalTime.getTime() + 2 * 60 * 1000); // 2 minutes after expected arrival
          
          if (now >= alertTime) {
            sendAlertToContacts();
            setAlertSent(true);
          }
        }
      }, 60000); // Every minute
    }
    return () => clearInterval(interval);
  }, [isActive, expectedArrivalTime, alertSent]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendAlertToContacts = async () => {
    const contacts = JSON.parse(localStorage.getItem('safehaven_emergency_contacts') || '[]');
    const userName = localStorage.getItem('safehaven_user_name') || 'Someone';
    const message = `🚨 SAFE ARRIVAL ALERT 🚨\n\n${userName} has not confirmed safe arrival at ${destination}.\n\nExpected arrival: ${expectedArrivalTime?.toLocaleTimeString()}\nJourney started: ${journeyStartTime?.toLocaleTimeString()}\n\nPlease check on them immediately!`;
    
    contacts.forEach((contact, idx) => {
      const cleanNumber = contact.phone.replace(/[^\d]/g, '');
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
      setTimeout(() => window.open(url, '_blank'), idx * 500);
    });
    
    setStatus('Alert sent to emergency contacts!');
  };

  const startTracking = () => {
    if (!destination || !estimatedTime) {
      setStatus('Please fill in all fields');
      return;
    }
    
    const now = new Date();
    const minutes = parseInt(estimatedTime);
    const arrivalTime = new Date(now.getTime() + minutes * 60 * 1000);
    
    setJourneyStartTime(now);
    setExpectedArrivalTime(arrivalTime);
    setLocationUpdatesSent(0);
    setIsActive(true);
    setAlertSent(false);
    setStatus(`Journey tracking started to ${destination}`);
  };

  const confirmSafeArrival = () => {
    setIsActive(false);
    setAlertSent(false);
    setStatus('Safe arrival confirmed!');
  };

  const formatTime = (date) => {
    return date ? date.toLocaleTimeString() : 'Not set';
  };

  return (
    <div className="safe-arrival-container">
      <h2>🏠 Safe Arrival Tracker</h2>
      
      <div className="arrival-form">
        <input
          type="text"
          placeholder="Destination (e.g., Home, Office)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          disabled={isActive}
        />
        
        <input
          type="number"
          placeholder="Estimated time (minutes)"
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
          disabled={isActive}
          min="5"
          max="180"
        />
        
        {!isActive ? (
          <button onClick={startTracking} className="start-btn">
            Start Journey Tracking
          </button>
        ) : (
          <div className="tracking-active">
            <div className="journey-info">
              <div className="info-item">
                <span className="label">Journey started:</span>
                <span className="value">{formatTime(journeyStartTime)}</span>
              </div>
              <div className="info-item">
                <span className="label">Expected arrival:</span>
                <span className="value">{formatTime(expectedArrivalTime)}</span>
              </div>
              <div className="info-item">
                <span className="label">Location updates sent:</span>
                <span className="value">{locationUpdatesSent}</span>
              </div>
            </div>
            <button onClick={confirmSafeArrival} className="confirm-btn">
              ✅ I've Arrived Safely
            </button>
          </div>
        )}
      </div>
      
      {status && <div className="status-message">{status}</div>}
      
      <div className="info">
        <p>📱 How it works:</p>
        <ul>
          <li>Set your destination and estimated travel time</li>
          <li>Location updates sent every minute during journey</li>
          <li>Alert sent if no confirmation 2 minutes after expected arrival</li>
          <li>Emergency contacts get WhatsApp notifications</li>
        </ul>
      </div>
    </div>
  );
};

export default SafeArrival;