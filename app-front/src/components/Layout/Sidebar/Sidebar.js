import React, { useState, useEffect } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo.png'; 


function Sidebar() {
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0); 
  const [isOpen, setIsOpen] = useState(true); 

  useEffect(() => {
    const fetchAlertsCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch("http://localhost:8000/alerts/", {
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
    localStorage.clear(); 
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
          <li><Link to="/dashboard">📊 Dashboard</Link></li>
          <li><Link to="/historique">📋 Historique</Link></li>
          
          <li style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/alertes" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              🔔 Alertes
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

          <li><Link to="/nodes">🌐 Nœuds</Link></li>
          <li><Link to="/capteurs">📡 Capteurs</Link></li>
          <li><Link to="/seuils">🎚️ Seuils</Link></li>
          <li><Link to="/satellite">🛰️ Sattelite</Link></li>
        </ul>

        <p className="nav-title">COMPTE</p>
        <ul>
          <li><Link to="/profil">👤 Profil </Link></li>
          <li>
            <Link to="/" onClick={handleLogout}>↪️ Déconnexion</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;