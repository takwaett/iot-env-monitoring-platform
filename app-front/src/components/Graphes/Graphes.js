import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import "./Graphes.css"

function Graphes() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:8000";

  // États pour les contrôles de la fenêtre temporelle et du polling
  const [period, setPeriod] = useState('30m');
  const [pollingInterval, setPollingInterval] = useState(30000);

  // Mapping strict pour lier les ID de vos composants aux clés d'InfluxDB
  const sensorMapping = {
    1: "temperature",
    2: "humidity",
    3: "air_quality",
    4: "pressure"
  };

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      // Tableau de promesses pour interroger les 4 endpoints InfluxDB en parallèle
      const requests = Object.entries(sensorMapping).map(async ([id, fieldName]) => {
        const response = await fetch(`${BASE_URL}/measurements/series?field_name=${fieldName}&period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          return (result.points || []).map(point => ({
            time: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullDate: new Date(point.time).toLocaleString(),
            value: point.value,
            s_id: Number(id) // Injecte l'ID numérique requis par votre RenderChart
          }));
        }
        return [];
      });

      const resultsArray = await Promise.all(requests);
      // Fusion de tous les points de données dans l'état unifié d'origine
      const combinedData = resultsArray.flat();
      setData(combinedData);

    } catch (err) {
      console.error("Erreur API Séries InfluxDB:", err);
    }
  }, [period, navigate]);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchHistory, pollingInterval]);

  const RenderChart = ({ sensorId, color, unit }) => {
    // Conservation stricte de votre logique de filtrage d'origine par ID
    const sensorData = data.filter(m => m.s_id === sensorId);

    return (
      <Box sx={{ height: '100%', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sensorData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id={`color${sensorId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit={unit}
              width={45}
            />
            <Tooltip labelFormatter={(idx, current) => current?.payload?.fullDate || idx} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#color${sensorId})`} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const sensors = [
    { title: "Température (°C)", id: 1, color: "#3b82f6", unit: "°C" },
    { title: "Humidité (%)", id: 2, color: "#10b981", unit: "%" },
    { title: "Qualité de l'Air (ppm)", id: 3, color: "#8b5cf6", unit: "ppm" },
    { title: "Pression (hPa)", id: 4, color: "#f59e0b", unit: "hPa" }
  ];

  return (
    <Box sx={{ width: '100%' }}>

      {/* Sélecteurs visuels ajoutés pour la gestion de la période et de la fréquence */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 1.5, background: '#fff', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
          ⏱️ Courbes Temporelles en Temps Réel
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Période Navigable</InputLabel>
            <Select value={period} label="Période Navigable" onChange={(e) => setPeriod(e.target.value)} sx={{ borderRadius: '10px' }}>
              <MenuItem value="30m">30 Minutes (Éch: 30s)</MenuItem>
              <MenuItem value="1h">1 Heure (Éch: 1m)</MenuItem>
              <MenuItem value="24h">24 Heures (Éch: 5m)</MenuItem>
              <MenuItem value="7d">7 Jours (Éch: 30m)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Rafraîchissement</InputLabel>
            <Select value={pollingInterval} label="Rafraîchissement" onChange={(e) => setPollingInterval(Number(e.target.value))} sx={{ borderRadius: '10px' }}>
              <MenuItem value={30000}>🔄 30 secondes</MenuItem>
              <MenuItem value={60000}>🔄 1 minute</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Grille d'affichage originale de vos 4 cartes indépendantes */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, width: '100%' }}>
        <Box sx={{ flex: 1, width: '50%' }}>
          <Paper sx={{ p: 2, borderRadius: '20px', height: '320px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #f0f5f9', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>{sensors[0].title}</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}><RenderChart sensorId={sensors[0].id} color={sensors[0].color} unit={sensors[0].unit} /></Box>
          </Paper>
        </Box>
        <Box sx={{ flex: 1, width: '50%' }}>
          <Paper sx={{ p: 2, borderRadius: '20px', height: '320px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #f0f5f9', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>{sensors[1].title}</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}><RenderChart sensorId={sensors[1].id} color={sensors[1].color} unit={sensors[1].unit} /></Box>
          </Paper>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
        <Box sx={{ flex: 1, width: '50%' }}>
          <Paper sx={{ p: 2, borderRadius: '20px', height: '320px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #f0f5f9', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>{sensors[2].title}</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}><RenderChart sensorId={sensors[2].id} color={sensors[2].color} unit={sensors[2].unit} /></Box>
          </Paper>
        </Box>
        <Box sx={{ flex: 1, width: '50%' }}>
          <Paper sx={{ p: 2, borderRadius: '20px', height: '320px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #f0f5f9', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>{sensors[3].title}</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}><RenderChart sensorId={sensors[3].id} color={sensors[3].color} unit={sensors[3].unit} /></Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default Graphes;
