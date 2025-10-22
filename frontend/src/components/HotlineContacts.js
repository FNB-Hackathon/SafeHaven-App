import React from 'react';
import './HotlineContacts.css';

const HotlineContacts = () => {
  const hotlines = [
    { name: 'Emergency Services', number: '10111', description: 'Police Emergency' },
    { name: 'Ambulance/Medical', number: '10177', description: 'Medical Emergency' },
    { name: 'Fire Department', number: '10177', description: 'Fire Emergency' },
    { name: 'Gender-Based Violence', number: '0800 428 428', description: 'GBV Command Centre' },
    { name: 'Childline', number: '116', description: 'Child Protection' },
    { name: 'Suicide Crisis Line', number: '0800 567 567', description: 'SADAG Crisis Line' },
    { name: 'Rape Crisis', number: '021 447 9762', description: 'Cape Town Rape Crisis' },
    { name: 'Stop Gender Violence', number: '0800 150 150', description: 'Stop Gender Violence' },
  ];

  const callNumber = (number) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="hotlines-container">
      <h2>Emergency Hotlines</h2>
      <div className="hotlines-list">
        {hotlines.map((hotline, index) => (
          <div key={index} className="hotline-item">
            <div className="hotline-info">
              <h3>{hotline.name}</h3>
              <p className="hotline-number">{hotline.number}</p>
              <p className="hotline-desc">{hotline.description}</p>
            </div>
            <button 
              onClick={() => callNumber(hotline.number)}
              className="call-btn"
            >
              📞 Call
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotlineContacts;