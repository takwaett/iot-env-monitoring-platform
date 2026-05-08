import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar from '../../components/Layout/Sidebar/Sidebar'; 
import Navbar from '../../components/Layout/Navbar/Navbar';
import { getUserProfile } from '../../api/auth'; 
import './Satellite.css';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const VILLES = [
  { nom: 'Bizerte',  lat: 37.27, lon: 9.87 },
  { nom: 'Tunis',    lat: 36.82, lon: 10.18 },
  { nom: 'Sousse',   lat: 35.83, lon: 10.64 },
  { nom: 'Kairouan', lat: 35.67, lon: 10.10 },
  { nom: 'Sfax',     lat: 34.74, lon: 10.76 },
  { nom: 'Gabès',    lat: 33.88, lon: 10.10 },
  { nom: 'Tozeur',   lat: 33.92, lon: 8.13 },
  { nom: 'Médenine', lat: 33.35, lon: 10.50 },
  { nom: 'Gafsa',    lat: 34.43, lon: 8.78 },
  { nom: 'Nabeul',   lat: 36.45, lon: 10.74 },
  { nom: 'Monastir', lat: 35.78, lon: 10.83 },
  { nom: 'Zarzis',   lat: 33.50, lon: 11.11 },
];

function getWeatherIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 99) return '⛈️';
  return '🌤️';
}

function getWeatherLabel(code) {
  if (code === 0) return 'Ensoleillé';
  if (code <= 2) return 'Partiellement nuageux';
  if (code <= 3) return 'Nuageux';
  if (code <= 48) return 'Brumeux';
  if (code <= 67) return 'Pluvieux';
  if (code <= 77) return 'Neigeux';
  if (code <= 82) return 'Averses';
  if (code <= 99) return 'Orageux';
  return 'Variable';
}

function tempColor(t) {
  if (t >= 35) return '#ef4444';
  if (t >= 28) return '#f97316';
  if (t >= 22) return '#eab308';
  if (t >= 15) return '#22c55e';
  if (t >= 8)  return '#3b82f6';
  return '#818cf8';
}

async function fetchMeteoVille(ville) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${ville.lat}&longitude=${ville.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature,surface_pressure&wind_speed_unit=kmh&timezone=Africa%2FTunis`;
  const res = await fetch(url);
  const data = await res.json();
  return {
    ...ville,
    temp: Math.round(data.current.temperature_2m),
    humidity: data.current.relative_humidity_2m,
    wind: Math.round(data.current.wind_speed_10m),
    pressure: Math.round(data.current.surface_pressure),
    feels: Math.round(data.current.apparent_temperature),
    code: data.current.weather_code,
  };
}

export default function Satellite() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [villes, setVilles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true); 
  const [user, setUser] = useState(null); 
  const [lastUpdate, setLastUpdate] = useState('');
  const [mapCenter, setMapCenter] = useState([34.5, 9.5]);
  const [mapZoom, setMapZoom] = useState(7);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/login');
    } else {
      getUserProfile()
        .then((data) => {
          setUser(data);
        })
        .catch((error) => {
          console.error("Erreur récupération profil :", error);
          navigate('/login');
        })
        .finally(() => {
          setUserLoading(false);
        });
    }
  }, [navigate]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const results = await Promise.all(VILLES.map(fetchMeteoVille));
        setVilles(results);
        setSelected(results.find(v => v.nom === 'Tunis') || results[0]);
        const now = new Date();
        setLastUpdate(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
      } catch (e) {
        console.error('Erreur météo:', e);
      }
      setLoading(false);
    }
    if (!userLoading) { 
      loadAll();
    }
  }, [userLoading]);


  if (userLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Chargement...</div>;
  }

  const handleRefresh = () => {
    setVilles([]);
    setLoading(true);
    Promise.all(VILLES.map(fetchMeteoVille)).then(results => {
      setVilles(results);
      setLoading(false);
      const now = new Date();
      setLastUpdate(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    });
  };

  const stats = villes.length > 0 ? {
    avgTemp: (villes.reduce((sum, v) => sum + v.temp, 0) / villes.length).toFixed(1),
    minTemp: Math.min(...villes.map(v => v.temp)),
    maxTemp: Math.max(...villes.map(v => v.temp)),
    avgHumidity: Math.round(villes.reduce((sum, v) => sum + v.humidity, 0) / villes.length),
  } : null;

  return (
    <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar />
      
      <div className="main-area">
        <Navbar 
          toggleSidebar={toggleSidebar} 
          user={user}
          searchTerm=""
          setSearchTerm={() => {}}
        />
        
        <div className="meteo-wrapper" style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          <div className="meteo-header">
            <div className="meteo-header-left">
              <span className="meteo-flag">🇹🇳</span>
              <div>
                <div className="meteo-title">Météo Tunisie - Carte Interactive</div>
                {lastUpdate && <div className="meteo-subtitle">Dernière mise à jour: {lastUpdate}</div>}
              </div>
            </div>
            <button className="meteo-refresh-btn" onClick={handleRefresh} title="Actualiser" disabled={loading}>
              {loading ? '⏳' : '🔄'}
            </button>
          </div>

          {stats && !loading && (
            <div className="meteo-stats-bar">
              <div className="meteo-stat-item">
                <span className="meteo-stat-icon">🌡️</span>
                <span className="meteo-stat-label">Moyenne</span>
                <span className="meteo-stat-value">{stats.avgTemp}°C</span>
              </div>
              <div className="meteo-stat-item">
                <span className="meteo-stat-icon">🔥</span>
                <span className="meteo-stat-label">Max</span>
                <span className="meteo-stat-value">{stats.maxTemp}°C</span>
              </div>
              <div className="meteo-stat-item">
                <span className="meteo-stat-icon">❄️</span>
                <span className="meteo-stat-label">Min</span>
                <span className="meteo-stat-value">{stats.minTemp}°C</span>
              </div>
              <div className="meteo-stat-item">
                <span className="meteo-stat-icon">💧</span>
                <span className="meteo-stat-label">Humidité</span>
                <span className="meteo-stat-value">{stats.avgHumidity}%</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="meteo-loading-box">
              <div className="meteo-spinner" />
              <span className="meteo-loading-text">Chargement des données météo en temps réel...</span>
            </div>
          ) : (
            <div className="meteo-body">
              <div className="meteo-map-wrapper">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  className="meteo-map"
                  zoomControl={true}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {villes.map((ville) => {
                    const color = tempColor(ville.temp);
                    const radius = stats ? 15 + (ville.temp - stats.minTemp) / (stats.maxTemp - stats.minTemp) * 15 : 15;
                    return (
                      <CircleMarker
                        key={ville.nom}
                        center={[ville.lat, ville.lon]}
                        radius={radius}
                        fillColor={color}
                        color="white"
                        weight={selected?.nom === ville.nom ? 3 : 1.5}
                        opacity={1}
                        fillOpacity={0.7}
                        eventHandlers={{
                          click: () => setSelected(ville),
                        }}
                      >
                        <Tooltip sticky>
                          <div style={{ textAlign: 'center' }}>
                            <strong>{ville.nom}</strong>
                            <br />
                            {ville.temp}°C {getWeatherIcon(ville.code)}
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    );
                  })}

                  {villes.map((ville) => (
                    <Marker
                      key={`marker-${ville.nom}`}
                      position={[ville.lat, ville.lon]}
                      eventHandlers={{
                        click: () => setSelected(ville),
                      }}
                    >
                      <Popup>
                        <div className="meteo-popup-content">
                          <h3 className="meteo-popup-title">
                            {getWeatherIcon(ville.code)} {ville.nom}
                          </h3>
                          <div className="meteo-popup-temp" style={{ color: tempColor(ville.temp) }}>
                            {ville.temp}°C
                          </div>
                          <div className="meteo-popup-detail">
                            <div>🌡️ Ressenti: {ville.feels}°C</div>
                            <div>💧 Humidité: {ville.humidity}%</div>
                            <div>💨 Vent: {ville.wind} km/h</div>
                            <div>📊 Pression: {ville.pressure} hPa</div>
                            <div>{getWeatherLabel(ville.code)}</div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              {selected && (
                <div className="meteo-detail-panel">
                  <div className="meteo-detail-header">
                    <div className="meteo-detail-city">
                      {getWeatherIcon(selected.code)} {selected.nom}
                    </div>
                    <button
                      className="meteo-close-detail"
                      onClick={() => setSelected(null)}
                      title="Fermer"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="meteo-detail-temp-row">
                    <span className="meteo-detail-temp" style={{ color: tempColor(selected.temp) }}>
                      {selected.temp}°C
                    </span>
                    <span className="meteo-detail-feels">(ressenti {selected.feels}°C)</span>
                  </div>
                  
                  <div className="meteo-detail-label">{getWeatherLabel(selected.code)}</div>
                  
                  <div className="meteo-detail-grid">
                    {[
                      { icon: '💧', label: 'Humidité', val: `${selected.humidity}%` },
                      { icon: '💨', label: 'Vent', val: `${selected.wind} km/h` },
                      { icon: '📊', label: 'Pression', val: `${selected.pressure} hPa` },
                      { icon: '📍', label: 'Position', val: `${selected.lat.toFixed(2)}°, ${selected.lon.toFixed(2)}°` },
                    ].map(({ icon, label, val }) => (
                      <div key={label} className="meteo-detail-item">
                        <span className="meteo-detail-item-icon">{icon}</span>
                        <span className="meteo-detail-item-label">{label}</span>
                        <span className="meteo-detail-item-val">{val}</span>
                      </div>
                    ))}
                  </div>

                
                  <div className="meteo-advice-box">
                    <span className="meteo-advice-icon">💡</span>
                    <span className="meteo-advice-text">
                      {selected.temp >= 35 ? "⚠️ Très chaud! Restez hydraté et évitez le soleil entre 12h-16h." :
                       selected.temp >= 30 ? "☀️ Chaud! Pensez à boire de l'eau régulièrement." :
                       selected.temp <= 10 ? "❄️ Frais! Habillez-vous chaudement." :
                       "🌤️ Conditions agréables, profitez de la journée!"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}