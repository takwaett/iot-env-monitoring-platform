import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar/Sidebar'; 
import Navbar from '../../components/Layout/Navbar/Navbar';
import { Box, TextField, MenuItem, Button, Paper, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales'; 
import { getUserProfile } from '../../api/auth'; 
import './Historique.css';
import HistoryIcon from '@mui/icons-material/History';
import GetAppIcon from '@mui/icons-material/GetApp';
import ViewListIcon from '@mui/icons-material/ViewList';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LoopIcon from '@mui/icons-material/Loop';

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
  const [exporting, setExporting] = useState(false);
  
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL;
  
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

  // FONCTION EXPORT CSV CORRIGÉE - Utilise l'endpoint public
  const exportToCSV = useCallback(async () => {
    setExporting(true);
    try {
      // Construire les paramètres de filtrage pour l'API
      const params = new URLSearchParams();
      
      // Ajouter les filtres actifs
      if (capteurFilter !== 'all') {
        params.append('sensor_id', capteurFilter);
      }
      if (noeudFilter !== 'all') {
        params.append('node_id', noeudFilter);
      }
      if (date) {
        params.append('start_date', date);
        params.append('end_date', date);
      }
      
      const queryString = params.toString();
      // CORRECTION: Utilisation de l'endpoint public /export/public
      const url = `${BASE_URL}/measurements/export/public${queryString ? `?${queryString}` : ''}`;
      
      console.log("URL d'export:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Récupérer le blob CSV
      const blob = await response.blob();
      
      // Extraire le nom du fichier de l'en-tête Content-Disposition
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `measurements_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match) filename = match[1];
      }
      
      // Télécharger le fichier
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
      
    } catch (error) {
      console.error("Erreur export CSV:", error);
      alert("Erreur lors de l'export des données. Veuillez réessayer.");
    } finally {
      setExporting(false);
    }
  }, [BASE_URL, capteurFilter, noeudFilter, date]);

  useEffect(() => { 
    if (!loading) { 
      fetchMetadata(); 
      fetchHistory(); 
    }
  }, [fetchMetadata, fetchHistory, loading]);
  
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
        <LoopIcon style={{ 
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

  // Fonction pour exporter les données actuellement affichées (alternative côté client)
  const exportCurrentView = () => {
    if (filteredRows.length === 0) {
      alert("Aucune donnée à exporter");
      return;
    }
    
    // Préparer les en-têtes CSV
    const headers = ['id', 'sensor_id', 'sensor_name', 'type', 'value', 'created_at', 'node_name'];
    const csvRows = [headers];
    
    // Ajouter les données filtrées
    filteredRows.forEach(row => {
      const sensorName = sensorsData[row.sensor_id]?.name || sensorsData[row.sensor_id]?.nom || `Capteur ${row.sensor_id}`;
      const sensorType = sensorsData[row.sensor_id]?.type || '';
      const nodeName = nodesMap[sensorsData[row.sensor_id]?.node_id] || "Non assigné";
      
      csvRows.push([
        row.id,
        row.sensor_id,
        sensorName,
        sensorType,
        row.value,
        row.created_at,
        nodeName
      ]);
    });
    
    // Créer et télécharger le CSV
    const csvContent = csvRows.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mesures_export_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

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
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HistoryIcon /> Historique des Données
          </Typography>

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
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Button 
              variant="contained" 
              onClick={() => { fetchHistory(); }}
              sx={{ bgcolor: '#161c2f', fontWeight: 'bold', px: 2, minWidth: '120px', '&:hover': { bgcolor: '#232d4a' } }}
              startIcon={<RefreshIcon />}
            >
              VOIR TOUT
            </Button>

            <Button 
              variant="contained" 
              onClick={() => { setDate(""); setCapteurFilter("all"); setNoeudFilter("all"); fetchHistory(); }}
              sx={{ bgcolor: '#161c2f', fontWeight: 'bold', px: 2, minWidth: '120px', '&:hover': { bgcolor: '#232d4a' } }}
              startIcon={<RestartAltIcon />}
            >
              Réinitialiser
            </Button>

            <Button 
              variant="contained" 
              onClick={exportToCSV}
              disabled={exporting}
              sx={{ 
                bgcolor: '#28a745', 
                fontWeight: 'bold', 
                px: 2, 
                minWidth: '160px',
                '&:hover': { bgcolor: '#218838' },
                '&.Mui-disabled': { bgcolor: '#6c757d' }
              }}
              startIcon={exporting ? <LoopIcon /> : <GetAppIcon />}
            >
              {exporting ? 'Export en cours...' : 'Exporter CSV'}
            </Button>

            <Button 
              variant="outlined" 
              onClick={exportCurrentView}
              sx={{ 
                borderColor: '#17a2b8', 
                color: '#17a2b8',
                fontWeight: 'bold',
                px: 2,
                minWidth: '160px',
                '&:hover': { borderColor: '#138496', backgroundColor: '#e0f7fa' }
              }}
              startIcon={<ViewListIcon />}
            >
              Export Vue Actuelle
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