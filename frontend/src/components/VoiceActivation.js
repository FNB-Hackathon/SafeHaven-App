import React, { useState, useEffect } from 'react';
import './VoiceActivation.css';

const VoiceActivation = ({ onEmergencyTrigger }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        if (transcript.includes('help me') || transcript.includes('emergency') || transcript.includes('panic')) {
          onEmergencyTrigger();
        }
      };

      setRecognition(recognitionInstance);
    }
  }, [onEmergencyTrigger]);

  const toggleListening = () => {
    if (recognition) {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
      setIsListening(!isListening);
    }
  };

  return (
    <div className="voice-activation">
      <button 
        className={`voice-btn ${isListening ? 'listening' : ''}`}
        onClick={toggleListening}
      >
        🎤 {isListening ? 'Listening...' : 'Voice Activation'}
      </button>
      <p className="voice-info">Say "Help me", "Emergency", or "Panic"</p>
    </div>
  );
};

export default VoiceActivation;