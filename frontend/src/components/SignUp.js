import React, { useState } from 'react';
import './SignUp.css';

const SignUp = ({ onSignupComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    emergencyContact1: '',
    emergencyContact1Name: '',
    emergencyContact2: '',
    emergencyContact2Name: '',
    medicalInfo: '',
    address: ''
  });
  const [status, setStatus] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      setStatus('Name and phone number are required');
      return;
    }

    // Save user data to localStorage
    localStorage.setItem('safehaven_user_name', formData.name);
    localStorage.setItem('safehaven_user_phone', formData.phone);
    localStorage.setItem('safehaven_user_email', formData.email);
    localStorage.setItem('safehaven_user_address', formData.address);
    localStorage.setItem('safehaven_medical_info', formData.medicalInfo);

    // Save emergency contacts
    const contacts = [];
    if (formData.emergencyContact1) {
      contacts.push({
        id: 1,
        name: formData.emergencyContact1Name || 'Emergency Contact 1',
        phone: formData.emergencyContact1,
        type: 'Primary'
      });
    }
    if (formData.emergencyContact2) {
      contacts.push({
        id: 2,
        name: formData.emergencyContact2Name || 'Emergency Contact 2',
        phone: formData.emergencyContact2,
        type: 'Secondary'
      });
    }
    
    if (contacts.length > 0) {
      localStorage.setItem('safehaven_emergency_contacts', JSON.stringify(contacts));
    }

    setIsSubmitted(true);
    setStatus('Account created successfully! You can now use SafeHaven.');
    
    // Auto-redirect after 2 seconds
    setTimeout(() => {
      if (onSignupComplete) onSignupComplete();
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className="signup-container">
        <div className="success-message">
          <h2>✅ Welcome to SafeHaven!</h2>
          <p>Your account has been created successfully.</p>
          <div className="user-info">
            <h3>Your Information:</h3>
            <p><strong>Name:</strong> {formData.name}</p>
            <p><strong>Phone:</strong> {formData.phone}</p>
            {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="continue-btn"
          >
            Continue to SafeHaven
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2>🛡️ Join SafeHaven</h2>
        <p className="subtitle">Create your safety profile</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+27821234567"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label>Home Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="123 Main St, City, Province"
            />
          </div>

          <div className="form-group">
            <label>Emergency Contact 1 Name</label>
            <input
              type="text"
              name="emergencyContact1Name"
              value={formData.emergencyContact1Name}
              onChange={handleInputChange}
              placeholder="Mom, Dad, Partner, etc."
            />
          </div>

          <div className="form-group">
            <label>Emergency Contact 1 Phone</label>
            <input
              type="tel"
              name="emergencyContact1"
              value={formData.emergencyContact1}
              onChange={handleInputChange}
              placeholder="+27821234567"
            />
          </div>

          <div className="form-group">
            <label>Emergency Contact 2 Name</label>
            <input
              type="text"
              name="emergencyContact2Name"
              value={formData.emergencyContact2Name}
              onChange={handleInputChange}
              placeholder="Friend, Sibling, etc."
            />
          </div>

          <div className="form-group">
            <label>Emergency Contact 2 Phone</label>
            <input
              type="tel"
              name="emergencyContact2"
              value={formData.emergencyContact2}
              onChange={handleInputChange}
              placeholder="+27821234567"
            />
          </div>

          <div className="form-group">
            <label>Medical Information</label>
            <textarea
              name="medicalInfo"
              value={formData.medicalInfo}
              onChange={handleInputChange}
              placeholder="Allergies, medications, medical conditions..."
              rows="3"
            />
          </div>

          <button type="submit" className="signup-btn">
            Create SafeHaven Account
          </button>
        </form>

        {status && <div className="status-message">{status}</div>}

        <div className="features-info">
          <h3>🚨 SafeHaven Features:</h3>
          <ul>
            <li>🆘 One-tap panic button</li>
            <li>📱 SMS & WhatsApp alerts</li>
            <li>📍 GPS location sharing</li>
            <li>🏠 Safe arrival tracking</li>
            <li>🎤 Audio distress detection</li>
            <li>🚶♂️ Immobile detection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SignUp;