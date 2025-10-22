# SafeHaven - Personal Safety App

A React frontend with Node.js backend for personal safety featuring panic button, incident reporting, and SMS alerts.

## Setup Instructions

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with Twilio credentials:
   ```
   TWILIO_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE=your_twilio_phone_number
   TWILIO_WHATSAPP_NUMBER=+14155238886
   PORT=5000
   ```

4. Start backend server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```
   REACT_APP_EMERGENCY_CONTACT=+1234567890
   ```

4. Start frontend:
   ```bash
   npm start
   ```

## Features

- **Panic Button**: Large pink emergency button that sends SMS alerts with location
- **Incident Reporting**: Form to report incidents with location tracking
- **Real-time Alerts**: View recent alerts and incidents
- **SMS & WhatsApp Notifications**: Automatic SMS and WhatsApp messages to emergency contacts via Twilio
- **Location Services**: GPS location capture for emergency situations
- **Pink Theme**: Calming pink color scheme throughout the interface

## Usage

1. **Emergency**: Press the large PANIC button to send immediate SMS alert
2. **Report Incident**: Use the form to report non-emergency incidents
3. **View Alerts**: Monitor recent alerts in the alerts panel
4. **Location**: Allow location access for accurate emergency positioning

The app runs on:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000