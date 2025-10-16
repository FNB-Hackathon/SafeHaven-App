import { Outlet, NavLink } from 'react-router-dom'
import TopNav from './components/TopNav'

export default function App() {
  return (
    <div className="container">
      <TopNav />
      <nav className="tabs">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/contacts" className={({ isActive }) => isActive ? 'active' : ''}>Contacts</NavLink>
        <NavLink to="/report" className={({ isActive }) => isActive ? 'active' : ''}>Report</NavLink>
        <NavLink to="/map" className={({ isActive }) => isActive ? 'active' : ''}>Map</NavLink>
        <NavLink to="/hotlines" className={({ isActive }) => isActive ? 'active' : ''}>Hotlines</NavLink>
        <NavLink to="/qr" className={({ isActive }) => isActive ? 'active' : ''}>QR</NavLink>
      </nav>
      <div className="content">
        <Outlet />
      </div>
      <footer className="footer">SafeZone • Hackathon Demo • FNB-aligned</footer>
    </div>
  )
}
