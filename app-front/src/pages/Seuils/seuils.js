import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar/Sidebar'; 
import Navbar from '../../components/Layout/Navbar/Navbar';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Modal, Box, Button, TextField, MenuItem, 
  Dialog, DialogActions, DialogTitle,
  IconButton, Typography
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import LoopIcon from '@mui/icons-material/Loop';
import { getUserProfile } from '../../api/auth'; 
import '../Dashboard/Dashboard.css';

const Seuils = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [thresholds, setThresholds] = useState([]); 
  const [sensors, setSensors] = useState([]);     
  const [nodes, setNodes] = useState([]);     
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  const [openModal, setOpenModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const [thresholdToDelete, setThresholdToDelete] = useState(null);
  const [selectedThreshold, setSelectedThreshold] = useState(null);

  const [formData, setFormData] = useState({
    minval: '',
    maxval: '',
    sensor_id: '',
    node_id: '',
    type: ''
  });

  const BASE_URL = process.env.REACT_APP_API_URL; 
  const MAIN_BLUE = "#161c2f"; 

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { 
      navigate('/login'); 
      return null; 
    }
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

  const fetchData = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers) return;

    try {
      const [t, s, n] = await Promise.all([
        fetch(`${BASE_URL}/thresholds/`, { headers }),
        fetch(`${BASE_URL}/sensors/`, { headers }),
        fetch(`${BASE_URL}/nodes/`, { headers })
      ]);

      if (t.ok) setThresholds(await t.json());
      if (s.ok) setSensors(await s.json());
      if (n.ok) setNodes(await n.json());
    } catch (err) {
      console.error("Erreur fetchData:", err);
    }
  }, [getAuthHeader]);

  useEffect(() => { 
    if (!loading) {
      fetchData(); 
    }
  }, [fetchData, loading]);

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
          color: MAIN_BLUE,
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

  const getNode = (id) => nodes.find(n => n.id === id);
  const getSensor = (id) => sensors.find(s => s.id === id);

  const columns = [
    {
      field: 'node_id',
      headerName: 'Nœud',
      flex: 1,
      renderCell: (p) => getNode(p.row.node_id)?.name || p.row.node_id
    },
    {
      field: 'sensor_id',
      headerName: 'Capteur',
      flex: 1,
      renderCell: (p) => getSensor(p.row.sensor_id)?.name || p.row.sensor_id
    },
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'minval', headerName: 'Min', flex: 0.5 },
    { field: 'maxval', headerName: 'Max', flex: 0.5 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            size="small"
            onClick={() => {
              const node = getNode(params.row.node_id);
              const sensor = getSensor(params.row.sensor_id);
              setSelectedThreshold({
                ...params.row,
                nodeName: node?.name || params.row.node_id,
                sensorName: sensor?.name || params.row.sensor_id
              });
              setOpenViewModal(true);
            }}
            title="Voir les détails"
          >
            <VisibilityIcon fontSize="inherit" />
          </IconButton>

          <IconButton
            color="primary"
            size="small"
            onClick={() => {
              setEditingId(params.row.id);
              setFormData({ ...params.row });
              setOpenModal(true);
            }}
            title="Modifier"
          >
            <EditIcon fontSize="inherit" />
          </IconButton>

          <IconButton
            color="error"
            size="small"
            onClick={() => {
              setThresholdToDelete(params.row.id);
              setOpenDeleteDialog(true);
            }}
            title="Supprimer"
          >
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </Box>
      )
    }
  ];

  const handleSave = async () => {
    const headers = getAuthHeader();
    if (!headers) return;

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `${BASE_URL}/thresholds/${editingId}/`
      : `${BASE_URL}/thresholds/`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setOpenModal(false);
        setEditingId(null);
        setFormData({ minval: '', maxval: '', sensor_id: '', node_id: '', type: '' });
        fetchData();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.detail || "Erreur lors de l'enregistrement"}`);
      }
    } catch (err) {
      console.error("Erreur handleSave:", err);
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    
    try {
      await fetch(`${BASE_URL}/thresholds/${thresholdToDelete}/`, {
        method: 'DELETE',
        headers
      });
      setOpenDeleteDialog(false);
      fetchData();
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert("Erreur lors de la suppression");
    }
  };

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

        <div style={{ padding: 20, backgroundColor: '#f5f5f5', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
            <h2 style={{ color: MAIN_BLUE }}>Gestion des Seuils</h2>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingId(null);
                setFormData({ minval: '', maxval: '', sensor_id: '', node_id: '', type: '' });
                setOpenModal(true);
              }}
              sx={{ backgroundColor: MAIN_BLUE, '&:hover': { backgroundColor: '#252d45' } }}
            >
              Ajouter 
            </Button>
          </div>

          <div style={{ height: 500, width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <DataGrid 
              rows={thresholds} 
              columns={columns} 
              disableRowSelectionOnClick
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } }
              }}
              pageSizeOptions={[10, 25, 50]}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8f9fa', color: MAIN_BLUE, fontWeight: 'bold' }
              }}
            />
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      <Modal open={openViewModal} onClose={() => setOpenViewModal(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500, bgcolor: 'white', borderRadius: 2, boxShadow: 24, overflow: 'hidden'
        }}>
          <Box sx={{ p: 2, borderBottom: `2px solid ${MAIN_BLUE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 'bold', color: MAIN_BLUE }}>Détails du Seuil</Typography>
            <IconButton onClick={() => setOpenViewModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              ['Nœud', selectedThreshold?.nodeName],
              ['Capteur', selectedThreshold?.sensorName],
              ['Type', selectedThreshold?.type],
              ['Min', selectedThreshold?.minval],
              ['Max', selectedThreshold?.maxval],
            ].map(([label, value]) => (
              <Box key={label} sx={rowStyle}>
                <b>{label} :</b> <span>{value}</span>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
            <Button variant="contained" sx={{ backgroundColor: MAIN_BLUE }} onClick={() => setOpenViewModal(false)}>
              FERMER
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ADD/EDIT MODAL */}
      <Modal open={openModal} onClose={() => { setOpenModal(false); setEditingId(null); }}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500, bgcolor: 'white', borderRadius: 2, boxShadow: 24, overflow: 'hidden'
        }}>
          <Box sx={{ p: 2, borderBottom: `2px solid ${MAIN_BLUE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 'bold', color: MAIN_BLUE }}>
              {editingId ? 'Modifier le Seuil' : 'Ajouter un Seuil'}
            </Typography>
            <IconButton onClick={() => { setOpenModal(false); setEditingId(null); }} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              select 
              size="small" 
              label="Nœud" 
              value={formData.node_id || ''}
              onChange={(e) => setFormData({ ...formData, node_id: e.target.value })}
              fullWidth
            >
              {nodes.map(n => <MenuItem key={n.id} value={n.id}>{n.name || n.nom}</MenuItem>)}
            </TextField>
            
            <TextField 
              select 
              size="small" 
              label="Capteur" 
              value={formData.sensor_id || ''}
              onChange={(e) => setFormData({ ...formData, sensor_id: e.target.value })}
              fullWidth
            >
              {sensors.map(s => <MenuItem key={s.id} value={s.id}>{s.name || s.nom}</MenuItem>)}
            </TextField>
            
            <TextField 
              size="small" 
              label="Type" 
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              fullWidth
            />
            
            <TextField 
              size="small" 
              label="Min" 
              type="number" 
              value={formData.minval || ''}
              onChange={(e) => setFormData({ ...formData, minval: e.target.value })}
              fullWidth
            />
            
            <TextField 
              size="small" 
              label="Max" 
              type="number" 
              value={formData.maxval || ''}
              onChange={(e) => setFormData({ ...formData, maxval: e.target.value })}
              fullWidth
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2 }}>
            <Button onClick={() => { setOpenModal(false); setEditingId(null); }}>Annuler</Button>
            <Button variant="contained" sx={{ backgroundColor: MAIN_BLUE }} onClick={handleSave}>
              ENREGISTRER
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* DELETE DIALOG */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Supprimer ce seuil ?</DialogTitle>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'flex-start',
  gap: '10px',
  backgroundColor: '#f5f5f5',
  padding: '12px 15px',
  borderRadius: 6
};

export default Seuils;