import React, { useState, useEffect } from 'react';
import './SafeArrival.css';

const SafeArrival = () => {
  const [isActive, setIsActive] = useState(false);
  const [destination, setDestination] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let interval;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            sendAlertToContacts();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendAlertToContacts = async () => {
    const contacts = JSON.parse(localStorage.getItem('safehaven_emergency_contacts') || '[]');
    const userName = localStorage.getItem('safehaven_user_name') || 'Someone';
    const message = `🚨 SAFE ARRIVAL ALERT 🚨\n\n${userName} has not confirmed safe arrival at ${destination}.\n\nPlease check on them immediately!`;
    
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
    
    const minutes = parseInt(estimatedTime);
    setTimeRemaining(minutes * 60);
    setIsActive(true);
    setStatus(`Tracking started for ${minutes} minutes`);
  };

  const confirmSafeArrival = () => {
    setIsActive(false);
    setTimeRemaining(0);
    setStatus('Safe arrival confirmed!');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          min="2"
          max="180"
        />
        
        {!isActive ? (
          <button onClick={startTracking} className="start-btn">
            Start Tracking
          </button>
        ) : (
          <div className="tracking-active">
            <div className="timer">
              Time remaining: {formatTime(timeRemaining)}
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
          <li>Set your destination and travel time</li>
          <li>If you don't confirm arrival, alerts are sent</li>
          <li>Emergency contacts get WhatsApp notifications</li>
        </ul>
      </div>
    </div>
  );
};

export default SafeArrival;