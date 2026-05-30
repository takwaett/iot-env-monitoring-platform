import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import SensorsIcon from '@mui/icons-material/Sensors';
import TuneIcon from '@mui/icons-material/Tune';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import DescriptionIcon from '@mui/icons-material/Description';
import ScienceIcon from '@mui/icons-material/Science';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

function Sidebar() {
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const fetchAlertsCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(process.env.REACT_APP_API_URL + "/alerts", {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAlertCount(data.length);
        }
      } catch (err) {
        console.error("Erreur badge sidebar:", err);
      }
    };

    fetchAlertsCount();

    const interval = setInterval(fetchAlertsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <aside className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="logo-section">
        <img src={logo} alt="Logo" />
        <div className="logo-text">
          <h1>EnviroSense</h1>
          <p>IoT Dashboard</p>
        </div>
      </div>
      <nav className="nav-menu">
        <p className="nav-title">NAVIGATION</p>
        <ul>
          <li><Link to="/dashboard"><DashboardIcon style={{ marginRight: '10px', fontSize: '20px' }} /> Dashboard</Link></li>
          <li><Link to="/historique"><HistoryIcon style={{ marginRight: '10px', fontSize: '20px' }} /> Historique</Link></li>

          <li style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/alertes" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <NotificationsActiveIcon style={{ marginRight: '10px', fontSize: '20px' }} />
              Alertes
              {alertCount > 0 && (
                <span style={{
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.7rem',
                  marginLeft: 'auto',
                  marginRight: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {alertCount}
                </span>
              )}
            </Link>
          </li>

          <li><Link to="/nodes"><DeviceHubIcon style={{ marginRight: '10px', fontSize: '20px' }} /> Nœuds</Link></li>
          <li><Link to="/capteurs"><SensorsIcon style={{ marginRight: '10px', fontSize: '20px' }} /> Capteurs</Link></li>
          <li><Link to="/seuils"><TuneIcon style={{ marginRight: '10px', fontSize: '20px' }} /> Seuils</Link></li>
          <li><Link to="/satellite"><SatelliteAltIcon style={{ marginRight: '10px', fontSize: '20px' }} /> Satellite</Link></li>
          <li><Link to="/rapports"><DescriptionIcon style={{ marginRight: '10px', fontSize: '20px' }} /> Rapports</Link></li>
          <li><Link to="/gaz"><ScienceIcon style={{ marginRight: '10px', fontSize: '20px' }} /> Gaz</Link></li>
        </ul>

        <p className="nav-title">COMPTE</p>
        <ul>
          <li><Link to="/profil"><AccountCircleIcon style={{ marginRight: '10px', fontSize: '20px' }} /> Profil</Link></li>
          <li>
            <Link to="/" onClick={handleLogout}><LogoutIcon style={{ marginRight: '10px', fontSize: '20px' }} /> Déconnexion</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;