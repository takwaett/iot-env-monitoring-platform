import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Notification.css";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const notifRef = useRef();

  const BASE_URL = "http://localhost:8000";

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/alerts/`, {
        headers: getAuthHeader()
      });
      
      if (response.ok) {
        const data = await response.json();
        const latestAlerts = data.slice(0, 10);
        
        const formattedNotifs = latestAlerts.map((alert, index) => {
          let icon = "🔔";
          if (alert.alert === "danger") icon = "⚠️";
          if (alert.alert === "inactivity") icon = "💤";
          if (alert.message?.toLowerCase().includes("température")) icon = "🌡️";
          if (alert.message?.toLowerCase().includes("humidité")) icon = "💧";
          if (alert.message?.toLowerCase().includes("qualité")) icon = "🌿";
          if (alert.message?.toLowerCase().includes("pression")) icon = "📊";
          
          // Calculer le temps écoulé
          const timeAgo = getTimeAgo(alert.created_at);
          
          return {
            id: alert.id || index,
            text: `${icon} ${alert.message}`,
            time: timeAgo,
            rawDate: alert.created_at,
            alertType: alert.alert,
            nodeId: alert.node_id,
            sensorId: alert.sensor_id
          };
        });
        
        setNotifications(formattedNotifs);
        // Compter les alertes non lues (si vous avez un champ "read" dans votre API)
        // Pour l'instant, on compte toutes les alertes récentes (moins de 24h)
        const recentUnread = latestAlerts.filter(alert => {
          const alertDate = new Date(alert.created_at);
          const now = new Date();
          const hoursDiff = (now - alertDate) / (1000 * 60 * 60);
          return hoursDiff < 24; // Alertes des dernières 24h
        }).length;
        setUnreadCount(recentUnread);
      } else {
        console.error("Erreur récupération alertes");
      }
    } catch (err) {
      console.error("Erreur fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };


  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return `Il y a ${diffDays} j`;
  };

  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAsRead = async (notifId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notifId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  const handleClickNotif = async (notif) => {
    await markAsRead(notif.id);
    setOpen(false);
    navigate("/alertes");
  };
  const handleSeeAll = () => {
    setOpen(false);
    navigate("/alertes");
  };

  return (
    <div className="notif-container" ref={notifRef}>
    
      <div className="bell" onClick={() => setOpen(!open)}>
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </div>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4>Notifications</h4>
            {loading && <span className="loading-spinner-small">⏳</span>}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                {loading ? "Chargement..." : "Aucune notification"}
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-item ${!notif.read ? 'unread' : ''} clickable`}
                  onClick={() => handleClickNotif(notif)}
                >
                  <div className="notif-text">{notif.text}</div>
                  <small className="notif-time">{notif.time}</small>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <button
              className="see-all"
              onClick={handleSeeAll}
            >
              Voir tout
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;