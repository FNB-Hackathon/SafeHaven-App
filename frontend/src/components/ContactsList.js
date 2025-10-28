import React, { useState, useEffect } from 'react';
import './ContactsList.css';

const ContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', type: 'Primary' });

  // Load contacts from localStorage on component mount
  useEffect(() => {
    const savedContacts = localStorage.getItem('safehaven_emergency_contacts');
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    } else {
      // Default contacts if none saved
      const defaultContacts = [
        { id: 1, name: 'Emergency Contact 1', phone: '+27722330418', type: 'Primary' },
        { id: 2, name: 'Family Member', phone: '+27614861915', type: 'Family' },
        { id: 3, name: 'Friend', phone: '+27731234567', type: 'Friend' }
      ];
      setContacts(defaultContacts);
      localStorage.setItem('safehaven_emergency_contacts', JSON.stringify(defaultContacts));
    }
  }, []);

  // Save contacts to localStorage whenever contacts change
  useEffect(() => {
    if (contacts.length > 0) {
      localStorage.setItem('safehaven_emergency_contacts', JSON.stringify(contacts));
    }
  }, [contacts]);

  const addContact = () => {
    if (newContact.name && newContact.phone) {
      const updatedContacts = [...contacts, { ...newContact, id: Date.now() }];
      setContacts(updatedContacts);
      setNewContact({ name: '', phone: '', type: 'Primary' });
    }
  };

  const removeContact = (id) => {
    const updatedContacts = contacts.filter(contact => contact.id !== id);
    setContacts(updatedContacts);
  };

  return (
    <div className="contacts-container">
      <h2>Emergency Contacts</h2>
      
      <div className="add-contact">
        <input
          type="text"
          placeholder="Name"
          value={newContact.name}
          onChange={(e) => setNewContact({...newContact, name: e.target.value})}
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={newContact.phone}
          onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
        />
        <select
          value={newContact.type}
          onChange={(e) => setNewContact({...newContact, type: e.target.value})}
        >
          <option value="Primary">Primary</option>
          <option value="Family">Family</option>
          <option value="Friend">Friend</option>
        </select>
        <button onClick={addContact}>Add</button>
      </div>

      <div className="contacts-list">
        {contacts.length === 0 ? (
          <p className="no-contacts">No emergency contacts added yet.</p>
        ) : (
          contacts.map(contact => (
            <div key={contact.id} className="contact-item">
              <div className="contact-info">
                <h3>{contact.name}</h3>
                <p>{contact.phone}</p>
                <span className="contact-type">{contact.type}</span>
              </div>
              <button onClick={() => removeContact(contact.id)} className="remove-btn">×</button>
            </div>
          ))
        )}
      </div>
      
      <div className="save-status">
        <p>✓ Contacts are automatically saved</p>
      </div>
    </div>
  );
};

export default ContactsList;

