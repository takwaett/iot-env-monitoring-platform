import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar/Sidebar';
import { getUserProfile } from '../../api/auth';
import Navbar from '../../components/Layout/Navbar/Navbar';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Button, MenuItem, TextField, Chip, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; 
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import '../Dashboard/Dashboard.css'; 

const Alertes = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [nodes, setNodes] = useState({});
  const [sensors, setSensors] = useState({});
  const [nodesDetails, setNodesDetails] = useState({});
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [filterAlert, setFilterAlert] = useState('toutes');
  const [filterNode, setFilterNode] = useState('tous');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

 
  const [openView, setOpenView] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);

  const BASE_URL = "http://localhost:8000";
  const MAIN_BLUE = "#161c2f";

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return null; }
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  }, [navigate]);

 
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
    const headers = getAuthHeader();
    if (!headers) return;
    try {
      const [nodesRes, sensorsRes] = await Promise.all([
        fetch(`${BASE_URL}/nodes/`, { headers }),
        fetch(`${BASE_URL}/sensors/`, { headers })
      ]);
      if (nodesRes.ok && sensorsRes.ok) {
        const nodesData = await nodesRes.json();
        const sensorsData = await sensorsRes.json();
        const nodeMap = {}; 
        const nodeDetailsMap = {};
        nodesData.forEach(n => {
          nodeMap[n.id] = n.name || n.nom;
          nodeDetailsMap[n.id] = {
            name: n.name || n.nom,
            adresseIP: n.adresseIP || n.IP || 'Adresse IP non disponible'
          };
        });
        const sensorMap = {}; 
        sensorsData.forEach(s => sensorMap[s.id] = s.name || s.nom);
        setNodes(nodeMap);
        setNodesDetails(nodeDetailsMap);
        setSensors(sensorMap);
      }
    } catch (err) { console.error(err); }
  }, [getAuthHeader]);

  const fetchAlerts = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    try {
      const response = await fetch(`${BASE_URL}/alerts/`, { headers });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.map((item, index) => ({ ...item, id: item.id || index })));
      }
    } catch (err) { console.error(err); }
  }, [getAuthHeader]);

  useEffect(() => { 
    if (!loading) {
      fetchMetadata(); 
      fetchAlerts(); 
    }
  }, [fetchMetadata, fetchAlerts, loading]);
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Chargement...</div>;
  }

  const filteredRows = alerts.filter((row) => {
    const matchAlert = filterAlert === 'toutes' || row.alert?.toLowerCase() === filterAlert.toLowerCase();
    const matchNode = filterNode === 'tous' || row.node_id.toString() === filterNode.toString();
    
    let matchDate = true;
    if (filterDateStart && filterDateEnd && row.created_at) {
      const rowDate = row.created_at.split('T')[0];
      matchDate = rowDate >= filterDateStart && rowDate <= filterDateEnd;
    } else if (filterDateStart && row.created_at) {
      const rowDate = row.created_at.split('T')[0];
      matchDate = rowDate >= filterDateStart;
    } else if (filterDateEnd && row.created_at) {
      const rowDate = row.created_at.split('T')[0];
      matchDate = rowDate <= filterDateEnd;
    }
    
    return matchAlert && matchNode && matchDate;
  });

  const handleOpenView = async (alertRow) => {
    const headers = getAuthHeader();
    if (!headers) return;

    try {
      const nodeResponse = await fetch(`${BASE_URL}/nodes/${alertRow.node_id}`, { headers });
      
      if (nodeResponse.ok) {
        const nodeData = await nodeResponse.json();
        console.log("Données du nœud reçues:", nodeData);

        setSelectedNodeDetails({
          name: nodeData.name || nodeData.nom || `Nœud ${alertRow.node_id}`,
          adresseIP: nodeData.adresseIP || "IP non renseignée"
        });
      } else {
        const fallback = nodesDetails[alertRow.node_id];
        setSelectedNodeDetails({
          name: fallback?.name || nodes[alertRow.node_id] || `ID: ${alertRow.node_id}`,
          adresseIP: fallback?.adresseIP || "Adresse IP non disponible"
        });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du nœud:", err);
      setSelectedNodeDetails({
        name: nodes[alertRow.node_id] || `ID: ${alertRow.node_id}`,
        adresseIP: "Erreur de chargement"
      });
    }
    
    setSelectedAlert(alertRow);
    setOpenView(true);
  };

  const getSeverityStyle = (severity) => {
    const s = severity?.toLowerCase();
    if (s === 'danger') return { bgcolor: '#ffebee', color: '#d32f2f', label: 'DANGER', icon: <NotificationsActiveIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} /> };
    if (s === 'inactivity') return { bgcolor: '#fff9c4', color: '#fbc02d', label: 'INACTIF', icon: <WarningAmberIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} /> };
    return { bgcolor: '#e3f2fd', color: '#1976d2', label: 'INFO', icon: null };
  };

  const columns = [
    { field: 'message', headerName: 'Message', flex: 2.5, renderCell: (params) => <span style={{ fontSize: '0.8rem' }}>{params.value}</span> },
    { field: 'created_at', headerName: 'Date de création', flex: 1.2, renderCell: (params) => <span style={{ fontSize: '0.8rem' }}>{new Date(params.value).toLocaleString('fr-FR')}</span> },
    { 
      field: 'alert', headerName: 'Alerte', flex: 0.8,
      renderCell: (params) => {
        const style = getSeverityStyle(params.value);
        return <Chip icon={style.icon} label={style.label} size="small" sx={{ bgcolor: style.bgcolor, color: style.color, fontWeight: 'bold', fontSize: '0.7rem', borderRadius: '4px' }} />;
      }
    },
    { field: 'node_id', headerName: 'Nœud', flex: 0.8, valueGetter: (value, row) => nodes[row.node_id] || `ID: ${row.node_id}` },
    { field: 'sensor_id', headerName: 'Capteur', flex: 0.8, valueGetter: (value, row) => sensors[row.sensor_id] || `ID: ${row.sensor_id}` },
    {
      field: 'actions', headerName: 'Actions', width: 100,
      renderCell: (params) => (
        <Box>
          <IconButton 
            color="primary" 
            size="small" 
            onClick={() => handleOpenView(params.row)}
            title="Voir les détails"
          >
            <VisibilityIcon fontSize="inherit" />
          </IconButton>
        </Box>
      ),
    },
  ];

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
        
        <div style={{ padding: '15px 25px', backgroundColor: '#f8f9fa', flex: 1, overflow: 'auto' }}>
          <h2 style={{ color: MAIN_BLUE, fontWeight: 800, margin: '0 0 10px 0', fontSize: '1.3rem' }}>Gestion des Alertes</h2>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5, bgcolor: '#fff', p: '8px 12px', borderRadius: 1, border: '1px solid #e0e0e0', flexWrap: 'wrap' }}>
            <TextField select size="small" label="Alerte" value={filterAlert} onChange={(e) => setFilterAlert(e.target.value)} sx={{ width: 110 }} InputProps={{ style: { fontSize: '0.8rem' } }}>
              <MenuItem value="toutes">Toutes</MenuItem>
              <MenuItem value="danger">Danger</MenuItem>
              <MenuItem value="inactivity">Inactif</MenuItem>
            </TextField>

            <TextField select size="small" label="Nœud" value={filterNode} onChange={(e) => setFilterNode(e.target.value)} sx={{ width: 140 }} InputProps={{ style: { fontSize: '0.8rem' } }}>
              <MenuItem value="tous">Tous les Nœuds</MenuItem>
              {Object.entries(nodes).map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
            </TextField>

           <TextField 
  type="date" 
  size="small" 
  value={filterDateStart} 
  onChange={(e) => setFilterDateStart(e.target.value)} 
  label="Date de  début"
  InputLabelProps={{ 
    shrink: true 
  }}
  sx={{ 
    width: 160,
    "& .MuiInputBase-input": { 
      fontSize: '0.8rem', 
      padding: '8.5px 14px',
    },
    "& .MuiInputLabel-root": { 
      backgroundColor: "white", 
      padding: "0 6px",         
      marginLeft: "-3px"        
    },
    "& fieldset": {
      top: 0                   
    }
  }} 
/>


       <TextField 
  type="date" 
  size="small" 
  value={filterDateStart} 
  onChange={(e) => setFilterDateStart(e.target.value)} 
  label="Date de fin"
  InputLabelProps={{ 
    shrink: true 
  }}
  sx={{ 
    width: 160,
    "& .MuiInputBase-input": { 
      fontSize: '0.8rem', 
      padding: '8.5px 14px',
    },
    "& .MuiInputLabel-root": { 
      backgroundColor: "white", 
      padding: "0 6px",         
      marginLeft: "-3px"        
    },
    "& fieldset": {
      top: 0                    
    }
  }} 
/>


            <Button variant="contained" onClick={() => { setFilterAlert('toutes'); setFilterNode('tous'); setFilterDateStart(''); setFilterDateEnd(''); fetchAlerts(); }} sx={{ backgroundColor: MAIN_BLUE, fontWeight: 'bold', ml: 'auto', fontSize: '0.7rem', height: 32 }}>
              RÉINITIALISER
            </Button>
          </Box>

          {/* TABLEAU */}
          <div style={{ height: 'calc(100vh - 180px)', background: '#fff', borderRadius: 8, padding: 5, border: '1px solid #e0e0e0' }}>
            <DataGrid 
              rows={filteredRows} 
              columns={columns} 
              disableRowSelectionOnClick 
              density="compact" 
              hideFooterSelectedRowCount 
              sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#fafafa', color: MAIN_BLUE, fontWeight: 'bold', fontSize: '0.85rem' } }} 
            />
          </div>
        </div>
      </div>

      {/* MODAL D'AFFICHAGE */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold', color: MAIN_BLUE, fontSize: '1.2rem', borderBottom: `2px solid ${MAIN_BLUE}` }}>
          Détails de l'Alerte
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedAlert && selectedNodeDetails && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Nom du nœud :</Box>
                <Box>{selectedNodeDetails.name}</Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Adresse IP :</Box>
                <Box>{selectedNodeDetails.adresseIP || "Non renseignée"}</Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Nom du capteur :</Box>
                <Box>{sensors[selectedAlert.sensor_id] || `ID: ${selectedAlert.sensor_id}`}</Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Message d'alerte :</Box>
                <Box sx={{ flex: 1 }}>{selectedAlert.message}</Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenView(false)} variant="contained" sx={{ backgroundColor: MAIN_BLUE, '&:hover': { backgroundColor: MAIN_BLUE } }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Alertes;