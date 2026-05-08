import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import  "./Graphes.css"

function Graphes() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:8000";

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      const response = await fetch(`${BASE_URL}/measurements/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
      
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        
        const chartData = result
          .map(item => ({ ...item, dateObj: new Date(item.created_at) }))
          .filter(item => item.dateObj >= twelveHoursAgo) 
          .sort((a, b) => a.dateObj - b.dateObj) 
          .reduce((acc, item) => {
            const hour = item.dateObj.getHours();
            const sensorKey = `${item.sensor_id}-${hour}`;

            if (!acc.seen.has(sensorKey)) {
              acc.seen.add(sensorKey);
              acc.list.push({
                ...item,
                time: `${hour}h`, 
                value: parseFloat(item.value),
                s_id: Number(item.sensor_id)
              });
            }
            return acc;
          }, { list: [], seen: new Set() }).list;

        setData(chartData);
      }
    } catch (err) { console.error("Erreur API:", err); }
  }, [navigate]);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const RenderChart = ({ sensorId, color, unit }) => {
    const sensorData = data.filter(m => m.s_id === sensorId);

    return (
      <Box sx={{ height: '100%', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sensorData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id={`color${sensorId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
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
              width={40}
            />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#color${sensorId})`} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const sensors = [
    { title: "Température (°C)", id: 1, color: "#3b82f6", unit: "°C" },
    { title: "Humidité (%)", id: 2, color: "#10b981", unit: "%" },
    { title: "Qualité de l'Air(ppm)", id: 3, color: "#8b5cf6", unit: "ppm" },
    { title: "Pression (hpa)", id: 4, color: "#f59e0b", unit: "hpa" }
  ];

  return (
    <Box sx={{ width: '100%' }}>
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
