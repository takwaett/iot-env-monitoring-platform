import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Navbar from '../../components/Layout/Navbar/Navbar';
import Sidebar from '../../components/Layout/Sidebar/Sidebar';
import Body from '../../components/Layout/Body/Body';
import { getUserProfile } from '../../api/auth';
import LoadingIcon from '@mui/icons-material/Loop';

function Dashboard() {    
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {   
    const token = localStorage.getItem("token");

    if (!token) {
      navigate('/login');
    } else {
      // Récupération du profil utilisateur
      getUserProfile()
        .then((data) => {
          setUser(data);
        })
        .catch((error) => {
          console.error("Erreur récupération profil :", error);
          navigate('/login');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <LoadingIcon style={{ 
          fontSize: '40px', 
          color: '#673ab7',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ fontSize: '16px', color: '#64748b' }}>Chargement...</div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      
      <Sidebar />
      
      <div className="main-area">  
        <Navbar 
          toggleSidebar={toggleSidebar} 
          user={user} 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        
        <Body user={user}/>
      </div>
    </div>
  );
}

export default Dashboard;