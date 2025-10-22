import React, { useState, useEffect } from 'react';
import PanicButton from './components/PanicButton';
import ReportForm from './components/ReportForm';
import AlertsList from './components/AlertsList';
import VoiceActivation from './components/VoiceActivation';
import ShakeDetection from './components/ShakeDetection';
import ContactsList from './components/ContactsList';
import HotlineContacts from './components/HotlineContacts';
import IncidentMap from './components/IncidentMap';
import Navigation from './components/Navigation';
import axios from 'axios';
import './App.css';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleEmergencyTrigger = async () => {
    try {
      const location = await getCurrentLocation();
      
      await axios.post('/api/panic', {
        message: `EMERGENCY ALERT: Help needed at ${location}. Triggered by voice/shake detection.`,
        to: process.env.REACT_APP_EMERGENCY_CONTACT || '+1234567890'
      });

      await axios.post('/api/whatsapp', {
        message: `🚨 EMERGENCY: Help needed at ${location}. Triggered by voice/shake detection via SafeHaven.`,
        to: process.env.REACT_APP_EMERGENCY_CONTACT || '+1234567890'
      });

      await axios.post('/api/reports', {
        description: 'Emergency triggered by voice/shake detection',
        location: location
      });

      fetchAlerts();
      alert('Emergency alert sent!');
    } catch (error) {
      console.error('Error sending emergency alert:', error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          },
          () => resolve('Location unavailable')
        );
      } else {
        resolve('Location not supported');
      }
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'contacts':
        return <ContactsList />;
      case 'reports':
        return (
          <div className="content-grid">
            <ReportForm onReportSubmit={fetchAlerts} />
            <AlertsList alerts={alerts} />
          </div>
        );
      case 'hotlines':
        return <HotlineContacts />;
      case 'map':
        return <IncidentMap />;
      default:
        return (
          <>
            <div className="panic-section">
              <PanicButton />
              <VoiceActivation onEmergencyTrigger={handleEmergencyTrigger} />
            </div>
            
            <div className="content-grid">
              <ReportForm onReportSubmit={fetchAlerts} />
              <AlertsList alerts={alerts} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="App">
      <ShakeDetection onShake={handleEmergencyTrigger} />
      
      <header className="header">
        <h1>SafeHaven</h1>
        <p>Your Safety, Our Priority</p>
      </header>
      
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;