import React, { useState, useEffect, useRef } from 'react';
import './AudioDetection.css';

const AudioDetection = () => {
  const [isActive, setIsActive] = useState(false);
  const [sensitivity, setSensitivity] = useState(80);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [status, setStatus] = useState('');
  const [alertCount, setAlertCount] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      startAudioMonitoring();
    } else {
      stopAudioMonitoring();
    }

    return () => stopAudioMonitoring();
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevel = () => {
        if (!isActive) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const volume = Math.round((average / 255) * 100);
        
        setCurrentVolume(volume);
        
        if (volume > sensitivity) {
          handleLoudSound();
        }
        
        requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
      setStatus('Audio monitoring active');
      
    } catch (error) {
      setStatus('Microphone access denied');
      setIsActive(false);
    }
  };

  const stopAudioMonitoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setCurrentVolume(0);
  };

  const handleLoudSound = () => {
    const newCount = alertCount + 1;
    setAlertCount(newCount);
    
    if (newCount >= 3) { // Trigger after 3 loud sounds
      sendAudioAlert();
      setAlertCount(0);
    }
  };

  const sendAudioAlert = async () => {
    const contacts = JSON.parse(localStorage.getItem('safehaven_emergency_contacts') || '[]');
    const userName = localStorage.getItem('safehaven_user_name') || 'Someone';
    const userPhone = localStorage.getItem('safehaven_user_phone') || 'Unknown';
    
    const message = `🚨 AUDIO ALERT 🚨\n\n${userName} (${userPhone})'s device detected loud sounds that may indicate distress.\n\nPlease check on them immediately!\n\nThis could be screaming, shouting, or other emergency sounds.`;
    
    contacts.forEach((contact, idx) => {
      const cleanNumber = contact.phone.replace(/[^\d]/g, '');
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
      setTimeout(() => window.open(url, '_blank'), idx * 500);
    });
    
    setStatus('Audio alert sent to emergency contacts!');
  };

  const toggleDetection = () => {
    setIsActive(!isActive);
    setAlertCount(0);
  };

  return (
    <div className="audio-container">
      <h2>🎤 Audio Detection</h2>
      
      <div className="audio-controls">
        <label>
          Sensitivity:
          <input
            type="range"
            min="50"
            max="95"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseInt(e.target.value))}
            disabled={isActive}
          />
          <span>{sensitivity}%</span>
        </label>
        
        <button 
          onClick={toggleDetection} 
          className={isActive ? 'stop-btn' : 'start-btn'}
        >
          {isActive ? 'Stop Detection' : 'Start Detection'}
        </button>
      </div>
      
      {isActive && (
        <div className="audio-status">
          <div className="volume-meter">
            <div className="volume-label">Current Volume:</div>
            <div className="volume-bar">
              <div 
                className="volume-fill" 
                style={{ width: `${currentVolume}%` }}
              ></div>
            </div>
            <span>{currentVolume}%</span>
          </div>
          
          <div className="alert-counter">
            Loud sounds detected: {alertCount}/3
          </div>
        </div>
      )}
      
      {status && <div className="status-message">{status}</div>}
      
      <div className="info">
        <p>🎤 How it works:</p>
        <ul>
          <li>Monitors ambient sound levels</li>
          <li>Detects screaming, shouting, or distress calls</li>
          <li>Sends alerts after 3 loud sound detections</li>
          <li>Adjust sensitivity based on environment</li>
        </ul>
      </div>
    </div>
  );
};

export default AudioDetection;