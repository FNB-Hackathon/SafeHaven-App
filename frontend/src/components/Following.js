import React, { useState, useEffect } from 'react';
import './Following.css';

const Following = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [locationsTracked, setLocationsTracked] = useState(0);
  const [missedCheckIns, setMissedCheckIns] = useState(0);
  const [checkInInterval] = useState('Every 2 minutes');

  useEffect(() => {
    let interval;
    
    if (isTracking) {
      interval = setInterval(() => {
        setLocationsTracked(prev => prev + 1);
      }, 120000); // Every 2 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  const handleCheckIn = () => {
    // Reset missed check-ins when user checks in
    setMissedCheckIns(0);
  };

  const stopTracking = () => {
    setIsTracking(false);
    setLocationsTracked(0);
    setMissedCheckIns(0);
  };

  const startTracking = () => {
    setIsTracking(true);
    setLocationsTracked(0);
    setMissedCheckIns(0);
  };

  return (
    <div className="following-container">
      <div className="following-header">
        <h1>🦶 "I'm Being Followed" Mode</h1>
      </div>
      
      <div className="tracking-card">
        <div className="status-indicator">
          <span className={`status-dot ${isTracking ? 'active' : 'inactive'}`}></span>
          <span className="status-text">
            {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
          </span>
        </div>
        
        <div className="tracking-stats">
          <div className="stat-item">
            <span className="stat-label">Locations tracked:</span>
            <span className="stat-value">{locationsTracked}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Check-in interval:</span>
            <span className="stat-value">{checkInInterval}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Missed check-ins:</span>
            <span className="stat-value">{missedCheckIns}</span>
          </div>
        </div>
        
        {isTracking ? (
          <div className="tracking-actions">
            <button className="check-in-btn" onClick={handleCheckIn}>
              ✓ I'm OK (Check In)
            </button>
            <button className="stop-tracking-btn" onClick={stopTracking}>
              Stop Tracking
            </button>
          </div>
        ) : (
          <button className="start-tracking-btn" onClick={startTracking}>
            Start Following Mode
          </button>
        )}
      </div>
    </div>
  );
};

export default Following;