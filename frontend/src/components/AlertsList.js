import React from 'react';
import './AlertsList.css';

const AlertsList = ({ alerts = [] }) => {
  const alertsArray = Array.isArray(alerts) ? alerts : [];
  
  return (
    <div className="alerts-container">
      <h2>Recent Alerts</h2>
      <div className="alerts-list">
        {alertsArray.length === 0 ? (
          <div className="no-alerts">No alerts at this time</div>
        ) : (
          alertsArray.map((alert, index) => (
            <div key={index} className="alert-item">
              <div className="alert-header">
                <span className="alert-status">🚨 Active</span>
                <span className="alert-time">
                  {new Date(alert.created_at).toLocaleString()}
                </span>
              </div>
              <div className="alert-description">{alert.description}</div>
              <div className="alert-location">📍 {alert.location}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsList;
