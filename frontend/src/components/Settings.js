import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
  const [userPhone, setUserPhone] = useState('');
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load saved data
    const savedPhone = localStorage.getItem('safehaven_user_phone') || '';
    const savedContacts = localStorage.getItem('safehaven_emergency_contacts');
    
    setUserPhone(savedPhone);
    
    if (savedContacts) {
      try {
        setContacts(JSON.parse(savedContacts));
      } catch (e) {
        console.error('Failed to load contacts:', e);
      }
    }
  }, []);

  const handleSaveUserPhone = () => {
    if (!userPhone.trim()) {
      setStatus('Please enter a valid phone number');
      return;
    }
    
    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (!phoneRegex.test(userPhone)) {
      setStatus('Invalid phone number format');
      return;
    }
    
    localStorage.setItem('safehaven_user_phone', userPhone.trim());
    setStatus('Your phone number saved successfully!');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      setStatus('Please enter both name and phone number');
      return;
    }
    
    // Validate phone format
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (!phoneRegex.test(newContact.phone)) {
      setStatus('Invalid phone number format');
      return;
    }
    
    const updatedContacts = [...contacts, {
      name: newContact.name.trim(),
      phone: newContact.phone.trim().replace(/[^\d+]/g, '')
    }];
    
    setContacts(updatedContacts);
    localStorage.setItem('safehaven_emergency_contacts', JSON.stringify(updatedContacts));
    setNewContact({ name: '', phone: '' });
    setStatus('Contact added successfully!');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleRemoveContact = (index) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    setContacts(updatedContacts);
    localStorage.setItem('safehaven_emergency_contacts', JSON.stringify(updatedContacts));
    setStatus('Contact removed successfully!');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="settings-container">
      <h2>⚙️ Settings</h2>
      
      {/* User Phone Number Section */}
      <div className="settings-section">
        <h3>Your Phone Number</h3>
        <p className="settings-description">
          This number will be included in emergency alerts sent to your contacts.
        </p>
        <div className="input-group">
          <input
            type="tel"
            placeholder="+27820000000"
            value={userPhone}
            onChange={(e) => setUserPhone(e.target.value)}
            className="settings-input"
          />
          <button onClick={handleSaveUserPhone} className="btn-save">
            Save
          </button>
        </div>
      </div>

      {/* Emergency Contacts Section */}
      <div className="settings-section">
        <h3>Emergency Contacts</h3>
        <p className="settings-description">
          These contacts will receive SMS alerts when you trigger the panic button.
        </p>
        
        {/* Contact List */}
        <div className="contacts-list">
          {contacts.length === 0 ? (
            <p className="no-contacts">No emergency contacts added yet.</p>
          ) : (
            contacts.map((contact, index) => (
              <div key={index} className="contact-item">
                <div className="contact-info">
                  <strong>{contact.name}</strong>
                  <span className="contact-phone">{contact.phone}</span>
                </div>
                <button 
                  onClick={() => handleRemoveContact(index)}
                  className="btn-remove"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add New Contact Form */}
        <div className="add-contact-form">
          <h4>Add New Contact</h4>
          <div className="input-group">
            <input
              type="text"
              placeholder="Name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="settings-input"
            />
          </div>
          <div className="input-group">
            <input
              type="tel"
              placeholder="Phone Number (e.g., +27820000000)"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              className="settings-input"
            />
          </div>
          <button onClick={handleAddContact} className="btn-add">
            Add Contact
          </button>
        </div>
      </div>

      {/* Phone Number Format Guide */}
      <div className="settings-section info-section">
        <h4>📱 Phone Number Format Guide</h4>
        <ul>
          <li>Include country code (e.g., +27 for South Africa)</li>
          <li>Example: +27820000000</li>
          <li>Remove spaces and special characters</li>
        </ul>
      </div>

      {status && <div className="status-message">{status}</div>}
    </div>
  );
};

export default Settings;
