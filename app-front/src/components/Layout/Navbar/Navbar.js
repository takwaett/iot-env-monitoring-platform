import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import Notification from '../../../components/Notification/Notification';

function Navbar({ toggleSidebar, user }) { 
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.clear(); 

    window.location.href = '/'; 
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const target = searchTerm.toLowerCase().trim();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderAvatarContent = (size = '40px', fontSize = '16px') => {
    if (user?.image) {
      return (
        <img 
          src={user.image} 
          alt="Profil" 
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} 
        />
      );
    }
    const initiale = user?.prenom?.charAt(0).toUpperCase() || user?.nom?.charAt(0).toUpperCase() || "?";
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', 
        backgroundColor: '#673ab7', color: 'white', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        fontWeight: 'bold', fontSize: fontSize
      }}>
        {initiale}
      </div>
    );
  };

  return (
    <div className="header-right" style={{ 
      position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'white', 
      width: '100%', display: 'flex', alignItems: 'center', 
      justifyContent: 'space-between', padding: '0 20px', 
      height: '70px', borderBottom: '1px solid #e2e8f0' 
    }}>
      <div className="navbar-left">
        <button 
          className="burger-icon" 
          onClick={toggleSidebar} 
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
        >
          ☰
        </button>
        <div className="navbar-titles">
          <h2 style={{ margin: 0 }}>EnviroSense</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Bienvenue, {user ? `${user.prenom}` : "Chargement..."} 👋
          </p>
        </div>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="🔍 Rechercher..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            onKeyDown={handleSearch} 
          />
        </div>
        
        <Notification />
        
        <div className="user-profile-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
          <div 
            className="user-profile" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div className="user-details" style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: '600' }}>
                {user ? `${user.prenom} ${user.nom}` : "Utilisateur"}
              </p>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
                {user?.role || "Chargement..."}
              </span>
            </div>
            <div className="avatar-trigger">
              {renderAvatarContent('40px', '16px')}
            </div>
          </div>

          {isDropdownOpen && (
            <div className="profile-dropdown" style={{
              position: 'absolute', top: '60px', right: 0, width: '280px',
              backgroundColor: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              borderRadius: '12px', border: '1px solid #e2e8f0', padding: '15px 0', zIndex: 1001
            }}>
              <div style={{ padding: '0 20px 15px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center' }}>
                {renderAvatarContent('45px', '18px')}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.prenom} {user?.nom}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</div>
                </div>
              </div>
              
              <ul style={{ listStyle: 'none', margin: '10px 0 0 0', padding: 0 }}>
                <li 
                  onClick={() => { navigate('/profil'); setIsDropdownOpen(false); }} 
                  style={menuItemStyle}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  👤 Mon Profil
                </li>
                {/* MODIFICATION ICI : Appel de handleLogout */}
                <li 
                  onClick={handleLogout} 
                  style={{ ...menuItemStyle, color: '#e11d48', borderTop: '1px solid #f1f5f9' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fff1f2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ↪️ Déconnexion
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const menuItemStyle = {
  padding: '12px 20px',
  cursor: 'pointer',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  transition: 'all 0.2s ease'
};

export default Navbar;
