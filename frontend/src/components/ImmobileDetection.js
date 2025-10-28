import React, { useState, useEffect } from 'react';
import './ImmobileDetection.css';

const ImmobileDetection = () => {
  const [isActive, setIsActive] = useState(false);
  const [alertThreshold] = useState(2); // Fixed at 2 minutes
  const [lastMovement, setLastMovement] = useState(Date.now());
  const [noMovementPeriod, setNoMovementPeriod] = useState(0);
  const [movementCount, setMovementCount] = useState(0);
  const [status, setStatus] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    let interval;
    let motionHandler;

    if (isActive) {
      interval = setInterval(() => {
        const timeSinceMovement = (Date.now() - lastMovement) / 1000;
        setNoMovementPeriod(timeSinceMovement);
        
        // Send alert after 2 minutes of no movement
        if (timeSinceMovement >= alertThreshold * 60 && !alertSent) {
          sendImmobileAlert();
          setAlertSent(true);
        }
      }, 1000);

      motionHandler = (event) => {
        const { acceleration } = event;
        if (acceleration) {
          const totalAcceleration = Math.abs(acceleration.x) + 
                                  Math.abs(acceleration.y) + 
                                  Math.abs(acceleration.z);
          
          if (totalAcceleration > 2) {
            setLastMovement(Date.now());
            setMovementCount(prev => prev + 1);
            setAlertSent(false); // Reset alert status on movement
          }
        }
      };

      if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', motionHandler);
      }
    }

    return () => {
      clearInterval(interval);
      if (motionHandler) {
        window.removeEventListener('devicemotion', motionHandler);
      }
    };
  }, [isActive, lastMovement, alertThreshold, alertSent]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendImmobileAlert = async () => {
    const contacts = JSON.parse(localStorage.getItem('safehaven_emergency_contacts') || '[]');
    const userName = localStorage.getItem('safehaven_user_name') || 'Someone';
    const userPhone = localStorage.getItem('safehaven_user_phone') || 'Unknown';
    
    const message = `🚨 IMMOBILE ALERT 🚨\n\n${userName} (${userPhone}) has been immobile for ${alertThreshold} minutes.\n\nLast movement: ${new Date(lastMovement).toLocaleTimeString()}\n\nPlease check on them immediately!\n\nThis could indicate an emergency situation.`;
    
    contacts.forEach((contact, idx) => {
      const cleanNumber = contact.phone.replace(/[^\d]/g, '');
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
      setTimeout(() => window.open(url, '_blank'), idx * 500);
    });
    
    setStatus('Immobile alert sent to emergency contacts!');
  };
  
  const notifyImOkay = () => {
    setLastMovement(Date.now());
    setMovementCount(prev => prev + 1);
    setAlertSent(false);
    setStatus('Confirmed you are okay - monitoring continues');
  };

  const startDetection = () => {
    setIsActive(true);
    setLastMovement(Date.now());
    setMovementCount(0);
    setAlertSent(false);
    setStatus(`Immobile detection started (${alertThreshold} min threshold)`);
  };

  const stopDetection = () => {
    setIsActive(false);
    setAlertSent(false);
    setStatus('Immobile detection stopped');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="immobile-container">
      <h2>🚶 Trapped/Immobile Detection</h2>
      
      <div className="description">
        <p>Activate this feature during emergencies. If no movement is detected for the set time period, emergency contacts will be automatically notified that you may be trapped or need immediate help.</p>
      </div>

      <div className="alert-section">
        <div className="threshold-info">
          <span className="label">Alert threshold:</span>
          <span className="value">{alertThreshold} minutes</span>
        </div>
      </div>

      <div className="how-it-works">
        <h3>📱 How It Works:</h3>
        <div className="feature-list">
          <div className="feature-item">🎵 Uses your phone's motion sensors</div>
          <div className="feature-item">🎵 Monitors for any movement or phone handling</div>
          <div className="feature-item">🎵 Alerts contacts if completely immobile</div>
          <div className="feature-item">🎵 Perfect for: trapped in car, fallen, medical emergency</div>
        </div>
      </div>
      
      {!isActive ? (
        <button onClick={startDetection} className="start-monitoring-btn">
          Start Monitoring
        </button>
      ) : (
        <div className="monitoring-active">
          <div className="movement-stats">
            <div className="stat-item">
              <span className="label">No movement for:</span>
              <span className="value">{formatTime(noMovementPeriod)}</span>
            </div>
            <div className="stat-item">
              <span className="label">Last movement:</span>
              <span className="value">{new Date(lastMovement).toLocaleTimeString()}</span>
            </div>
            <div className="stat-item">
              <span className="label">Movement detected:</span>
              <span className="value">{movementCount} times</span>
            </div>
          </div>
          
          <div className="action-buttons">
            <button onClick={notifyImOkay} className="im-okay-btn">
              ✅ I'm Okay
            </button>
            <button onClick={stopDetection} className="stop-monitoring-btn">
              Stop Monitoring
            </button>
          </div>
        </div>
      )}
      
      {status && <div className="status-message">{status}</div>}
    </div>
  );
};

export default ImmobileDetection;