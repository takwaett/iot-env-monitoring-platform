import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar/Sidebar'; 
import Navbar from '../../components/Layout/Navbar/Navbar';
import { Box, TextField, MenuItem, Button, Paper, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales'; 
import { getUserProfile } from '../../api/auth'; 
import './Historique.css';

function Historique() {
  const [date, setDate] = useState("");
  const [capteurFilter, setCapteurFilter] = useState("all");
  const [noeudFilter, setNoeudFilter] = useState("all"); 
  const [mesures, setMesures] = useState([]);
  const [sensorsData, setSensorsData] = useState({});
  const [nodesMap, setNodesMap] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 
  
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:8000";

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
          setLoading(false);
        });
    }
  }, [navigate]);

  const fetchMetadata = useCallback(async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [resSensors, resNodes] = await Promise.all([
        fetch(`${BASE_URL}/sensors/`, { headers }),
        fetch(`${BASE_URL}/nodes/`, { headers })
      ]);
      if (resSensors.ok && resNodes.ok) {
        const sData = await resSensors.json();
        const nData = await resNodes.json();
        const sMap = {}; sData.forEach(s => { sMap[s.id] = s; });
        const nMap = {}; nData.forEach(n => { nMap[n.id] = n.name || n.nom; });
        setSensorsData(sMap); 
        setNodesMap(nMap);
      }
    } catch (err) { console.error("Erreur Metadata:", err); }
  }, [BASE_URL]);

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const response = await fetch(`${BASE_URL}/measurements/`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (response.ok) {
        const data = await response.json();
        setMesures(data.map((item, index) => ({ ...item, id: item.id || index })));
      }
    } catch (err) { console.error("Erreur History:", err); }
  }, [navigate, BASE_URL]);

  useEffect(() => { 
    if (!loading) { 
      fetchMetadata(); 
      fetchHistory(); 
    }
  }, [fetchMetadata, fetchHistory, loading]);
  if (loading) {
    return <div>Chargement...</div>;
  }

  const columns = [
    { field: 'created_at', headerName: 'Horodatage', flex: 1.2, valueFormatter: (value) => value ? new Date(value).toLocaleString('fr-FR') : '' },
    { field: 'value', headerName: 'Valeur', flex: 0.8, renderCell: (params) => <strong>{params.value}</strong> },
    { 
      field: 'sensor_id', 
      headerName: 'Capteur', 
      flex: 1, 
      valueGetter: (value) => sensorsData[value]?.name || sensorsData[value]?.nom || `ID: ${value}`
    },
    { 
      field: 'node_name', 
      headerName: 'Nœud', 
      flex: 1,
      valueGetter: (value, row) => {
        const nodeId = sensorsData[row.sensor_id]?.node_id;
        return nodesMap[nodeId] || "Non assigné";
      }
    },
  ];

  const filteredRows = mesures.filter(item => {
    const matchCapteur = capteurFilter === 'all' || String(item.sensor_id) === String(capteurFilter);
    const sensorNodeId = sensorsData[item.sensor_id]?.node_id;
    const matchNoeud = noeudFilter === 'all' || String(sensorNodeId) === String(noeudFilter);
    
    let matchDate = true;
    if (date && item.created_at) { matchDate = item.created_at.substring(0, 10) === date; }
    return matchCapteur && matchNoeud && matchDate;
  });

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
        
        <main style={{ padding: '20px 30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>📋 Historique des Données</Typography>

          <Paper sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1, alignItems: 'center', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <TextField 
              select size="small" label="Capteur" value={capteurFilter} 
              onChange={(e) => setCapteurFilter(e.target.value)} 
              sx={{ width: 150 }}
            >
              <MenuItem value="all">Tous les capteurs</MenuItem>
              {Object.entries(sensorsData).map(([id, s]) => (
                <MenuItem key={id} value={id}>{s.name || s.nom}</MenuItem>
              ))}
            </TextField>

            <TextField 
              select size="small" label="Nœud" value={noeudFilter} 
              onChange={(e) => setNoeudFilter(e.target.value)} 
              sx={{ width: 150 }}
            >
              <MenuItem value="all">Tous les nœuds</MenuItem>
              {Object.entries(nodesMap).map(([id, name]) => (
                <MenuItem key={id} value={id}>{name}</MenuItem>
              ))}
            </TextField>

            <input 
              type="date" 
              style={{ padding: '8.5px', borderRadius: '4px', border: '1px solid #ccc', width: '130px' }} 
              onChange={(e) => setDate(e.target.value)} 
              value={date}
            />
            
            <input 
              type="date" 
              style={{ padding: '8.5px', borderRadius: '4px', border: '1px solid #ccc', width: '130px' }} 
              onChange={(e) => setDate(e.target.value)} 
              value={date}
            />
            <Box sx={{ flexGrow: 1 }} />
            
            <Button 
              variant="contained" 
              onClick={() => { fetchHistory(); }}
              sx={{ bgcolor: '#161c2f', fontWeight: 'bold', px: 2, '&:hover': { bgcolor: '#232d4a' } }}
            >
              VOIR TOUT
            </Button>

            <Button 
              variant="contained" 
              onClick={() => { setDate(""); setCapteurFilter("all"); setNoeudFilter("all"); fetchHistory(); }}
              sx={{ bgcolor: '#161c2f', fontWeight: 'bold', px: 2 }}
            >
              Réinitialiser
            </Button>
          </Paper>

          <Box sx={{ height: 480, background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              initialState={{
                pagination: { paginationModel: { pageSize: 100, page: 0 } },
              }}
              pageSizeOptions={[10, 25, 50, 100]} 
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8f9fa' },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #f1f5f9' }
              }}
            />
          </Box>
        </main>
      </div>
    </div>
  );
}

export default Historique;