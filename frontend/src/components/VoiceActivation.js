import React, { useState, useEffect } from 'react';
import './VoiceActivation.css';

const VoiceActivation = ({ onEmergencyTrigger }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [supported, setSupported] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const hasAPI = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    setSupported(!!hasAPI);
    if (!hasAPI) {
      setMessage('Voice activation not supported in this browser. Use Chrome on desktop/Android.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (transcript.includes('help me') || transcript.includes('emergency') || transcript.includes('panic')) {
        setMessage('Voice keyword detected. Triggering emergency...');
        onEmergencyTrigger();
      }
    };

    recognitionInstance.onerror = (e) => {
      const reason = e && e.error;
      if (reason === 'not-allowed' || reason === 'service-not-allowed') {
        setMessage('Microphone permission denied. Allow mic access and try again.');
      } else if (reason === 'no-speech') {
        setMessage('No speech detected. Try again.');
      } else {
        setMessage('Speech recognition error. Try again.');
      }
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      // When manually stopped, keep state in sync
      setIsListening(false);
    };

    setRecognition(recognitionInstance);
  }, [onEmergencyTrigger]);

  const toggleListening = () => {
    if (!supported) return;
    if (recognition) {
      if (isListening) {
        recognition.stop();
        setMessage('');
      } else {
        try {
          recognition.start();
          setMessage('Listening for "help me", "emergency", or "panic"...');
        } catch (_) {
          // start can throw if called too quickly
        }
      }
      setIsListening(!isListening);
    }
  };

  return (
    <div className="voice-activation">
      <button 
        className={`voice-btn ${isListening ? 'listening' : ''}`}
        onClick={toggleListening}
        disabled={!supported}
      >
        🎤 {isListening ? 'Listening...' : 'Voice Activation'}
      </button>
      <p className="voice-info">Say "Help me", "Emergency", or "Panic"</p>
      {message && <p className="voice-status">{message}</p>}
      {!supported && <p className="voice-status">Voice recognition requires Chrome (desktop/Android).</p>}
    </div>
  );
};

export default VoiceActivation;