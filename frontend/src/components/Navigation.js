import React from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, setActiveTab }) => {
  const hasUser = localStorage.getItem('safehaven_user_name');
  
  const tabs = hasUser ? [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'following', label: 'Following', icon: '🦶' },
    { id: 'safearrival', label: 'Arrival', icon: '✅' },
    { id: 'immobile', label: 'Immobile', icon: '⏰' },
    { id: 'audio', label: 'Audio', icon: '🎤' },
    { id: 'contacts', label: 'Contacts', icon: '👥' },
    { id: 'reports', label: 'Reports', icon: '📝' },
    { id: 'hotlines', label: 'Hotlines', icon: '📞' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ] : [
    { id: 'signup', label: 'Sign Up', icon: '📋' },
  ];

  return (
    <nav className="navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;