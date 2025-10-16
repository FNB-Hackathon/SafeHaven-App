# SafeZone Demo (Hackathon Prototype)

A standalone demo showcasing a panic button and simulated emergency alert workflow, suitable for hackathon presentation. Includes a React (Vite + TypeScript) frontend and a Node/Express backend that simulates sending alerts and managing contacts.

## Features

- Panic button to trigger an alert
- Smart detection simulation (button to simulate detection event)
- Contacts list (mocked via backend)
- Alert confirmation & status toasts
- Simple report form

## Tech Stack

- Frontend: Vite + React + TypeScript, react-router-dom
- Backend: Node.js + Express, CORS

## Getting Started

### Prerequisites

- Node.js 18+

### Setup

1. Install dependencies

```bash
cd safezone-frontend && npm install
cd ../safezone-backend && npm install
```

2. Run backend (port 4000)

```bash
npm run dev
```

Run the above inside `safezone-backend/`.

3. Run frontend (port 5173)

```bash
npm run dev
```

Run the above inside `safezone-frontend/`.

4. Open the app

- http://localhost:5173

## Frontend Scripts

Inside `safezone-frontend/`:

- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview production build

## Backend Scripts

Inside `safezone-backend/`:

- `npm run dev` – start server with nodemon
- `npm start` – start server

## API Endpoints

- `POST /api/alert` – simulate sending an alert
- `GET /api/contacts` – get mocked emergency contacts
- `POST /api/report` – submit a report payload

## Pitch Guide (Cheat Sheet)

- Problem: GBV is urgent; victims need fast, trusted help.
- Solution: SafeZone demo with panic + smart detection.
- Value: Aligns with FNB values (customer focus, simplicity, cost efficiency).
- Impact: Saves lives, builds trust, positions FNB as an innovator.
