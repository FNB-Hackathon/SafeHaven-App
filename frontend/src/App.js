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
import LocationDebugPanel from './components/LocationDebugPanel';
import Settings from './components/Settings';
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
      const buildLocationLink = (loc) => {
        if (!loc) return '';
        const m = loc.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (m) {
          const lat = m[1];
          const lng = m[2];
          return `https://www.google.com/maps?q=${lat},${lng}`;
        }
        const q = loc.replace(/^Approximate:\s*/i, '').trim();
        return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
      };
      const locationLink = buildLocationLink(location);
      const envList = process.env.REACT_APP_EMERGENCY_CONTACTS || process.env.REACT_APP_EMERGENCY_CONTACT || '';
      const emergencyContacts = envList
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (emergencyContacts.length === 0) {
        alert('No emergency contacts configured. Set REACT_APP_EMERGENCY_CONTACT(S) in frontend/.env');
        return;
      }

      const message = `🚨 EMERGENCY: Help needed at ${location}. ${locationLink ? `Map: ${locationLink}. ` : ''}Triggered by voice/shake detection via SafeHaven.`;
      emergencyContacts.forEach((to, idx) => {
        const number = to.replace(/[^\d+]/g, '');
        const url = `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(message)}`;
        setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), idx * 300);
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
    // Check for manual override first
    const saved = localStorage.getItem('safehaven_manual_location');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return Promise.resolve(`${data.address} (${data.latitude}, ${data.longitude}) ±0m [Manual]`);
      } catch (e) {
        console.error('Failed to load manual location:', e);
      }
    }

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

    const geoFallbacks = async (resolve) => {
      try {
        const geoResp = await fetch(
          `https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`,
          { method: 'POST' }
        );
        if (geoResp.ok) {
          const geoData = await geoResp.json();
          if (geoData && geoData.location && geoData.location.lat && geoData.location.lng) {
            const { lat, lng } = geoData.location;
            try {
              const address = await getAddressFromCoords(lat, lng);
              const acc = geoData.accuracy || 500;
              resolve(`${address} (${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}) ±${Math.round(acc)}m [Network]`);
              return;
            } catch (_) {
              const acc = geoData.accuracy || 500;
              resolve(`${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)} ±${Math.round(acc)}m [Network]`);
              return;
            }
          }
        }
      } catch (_) {}

      try {
        const resp = await fetch('https://ipapi.co/json');
        const data = await resp.json();
        if (data) {
          const approx = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
          if (data.latitude && data.longitude) {
            resolve(`Approximate: ${approx} (${Number(data.latitude).toFixed(6)}, ${Number(data.longitude).toFixed(6)}) [IP]`);
            return;
          }
          if (approx) {
            resolve(`Approximate: ${approx}`);
            return;
          }
        }
      } catch (_) {}
      resolve('Location unavailable');
    };

    return new Promise((resolve) => {
      if (navigator.geolocation) {
        let best = null;
        let watchId = null;
        const accuracyThreshold = 20; // meters
        const maxWaitMs = 12000;
        const started = Date.now();

        const finish = async () => {
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          if (best) {
            const { latitude, longitude, accuracy } = best.coords;
            try {
              const address = await getAddressFromCoords(latitude, longitude);
              resolve(`${address} (${latitude.toFixed(6)}, ${longitude.toFixed(6)}) ±${Math.round(accuracy)}m [GPS]`);
            } catch {
              resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)} ±${Math.round(accuracy)}m [GPS]`);
            }
          } else {
            await geoFallbacks(resolve);
          }
        };

        const onPos = (pos) => {
          if (!best || pos.coords.accuracy < best.coords.accuracy) {
            best = pos;
          }
          if (pos.coords.accuracy <= accuracyThreshold || Date.now() - started > maxWaitMs) {
            finish();
          }
        };

        const onErr = async () => {
          await geoFallbacks(resolve);
        };

        watchId = navigator.geolocation.watchPosition(onPos, onErr, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: maxWaitMs
        });

        setTimeout(() => finish(), maxWaitMs + 200);
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
      case 'settings':
        return <Settings />;
      default:
        return (
          <>
            <LocationDebugPanel />
            
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