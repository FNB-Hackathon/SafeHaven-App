import React, { useState, useEffect } from 'react';
import './ImmobileDetection.css';

const ImmobileDetection = () => {
  const [isActive, setIsActive] = useState(false);
  const [timeLimit, setTimeLimit] = useState(5);
  const [lastMovement, setLastMovement] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [movementCount, setMovementCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let interval;
    let motionHandler;

    if (isActive) {
      interval = setInterval(() => {
        const timeSinceMovement = (Date.now() - lastMovement) / 1000;
        const remaining = Math.max(0, timeLimit * 60 - timeSinceMovement);
        
        setTimeRemaining(remaining);
        
        if (timeSinceMovement >= 120 && !showWarning) {
          setShowWarning(true);
        }
        
        if (remaining <= 0) {
          sendImmobileAlert();
          setIsActive(false);
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
            setShowWarning(false);
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
  }, [isActive, lastMovement, timeLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendImmobileAlert = async () => {
    const contacts = JSON.parse(localStorage.getItem('safehaven_emergency_contacts') || '[]');
    const userName = localStorage.getItem('safehaven_user_name') || 'Someone';
    const userPhone = localStorage.getItem('safehaven_user_phone') || 'Unknown';
    
    const message = `🚨 IMMOBILE ALERT 🚨\\n\\n${userName} (${userPhone}) has been immobile for ${timeLimit} minutes.\\n\\nPlease check on them immediately!\\n\\nThis could indicate an emergency situation.`;
    
    contacts.forEach((contact, idx) => {
      const cleanNumber = contact.phone.replace(/[^\\d]/g, '');
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
      setTimeout(() => window.open(url, '_blank'), idx * 500);
    });
    
    setStatus('Immobile alert sent to emergency contacts!');
  };

  const startDetection = () => {
    setIsActive(true);
    setLastMovement(Date.now());
    setMovementCount(0);
    setShowWarning(false);
    setStatus(`Immobile detection started (${timeLimit} min limit)`);
  };

  const stopDetection = () => {
    setIsActive(false);
    setTimeRemaining(0);
    setShowWarning(false);
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
        <label className="alert-label">Alert After No Movement For:</label>
        <select 
          value={timeLimit} 
          onChange={(e) => setTimeLimit(parseInt(e.target.value))}
          disabled={isActive}
          className="time-select"
        >
          <option value={2}>2 minutes</option>
          <option value={5}>5 minutes</option>
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={120}>2 hours</option>
        </select>
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
          <div className="timer-display">
            Time until alert: {formatTime(timeRemaining)}
          </div>
          <div className="movement-stats">
            <div>Movement count: {movementCount}</div>
            <div>Last movement: {Math.floor((Date.now() - lastMovement) / 1000)}s ago</div>
          </div>
          {showWarning && (
            <div className="warning-alert">
              ⚠️ WARNING: No movement detected for 2+ minutes!
            </div>
          )}
          <button onClick={stopDetection} className="stop-monitoring-btn">
            Stop Monitoring
          </button>
        </div>
      )}
      
      {status && <div className="status-message">{status}</div>}
    </div>
  );
};

export default ImmobileDetection;