import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar/Sidebar';
import Navbar from '../../components/Layout/Navbar/Navbar';
import { DataGrid } from '@mui/x-data-grid';
import { Modal, Box, Button, TextField, MenuItem, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getUserProfile } from '../../api/auth';
import '../Dashboard/Dashboard.css';

const SENSOR_TYPES = [
  { label: 'Température', value: 'température' },
  { label: 'Pression', value: 'pression' },
  { label: 'Humidité', value: 'humidité' },
  { label: "Qualité de l'air", value: "Qualité de l'air" },
];

const Capteurs = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sensors, setSensors] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [sensorToDelete, setSensorToDelete] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  const [openView, setOpenView] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    node_id: ''
  });

  const navigate = useNavigate();
  const BASE_URL = "http://localhost:8000";
  const MAIN_BLUE = "#161c2f";

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const fetchSensors = async () => {
    try {
      const response = await fetch(`${BASE_URL}/sensors/`, { headers: getAuthHeader() });
      if (response.ok) {
        const data = await response.json();
        setSensors(data.map(s => ({ ...s, id: s.id })));
      }
    } catch (err) { console.error("Erreur capteurs:", err); }
  };

  const fetchNodesList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/nodes/`, { headers: getAuthHeader() });
      if (response.ok) {
        const data = await response.json();
        setNodes(data);
      }
    } catch (err) { console.error("Erreur nœuds:", err); }
  };
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
  useEffect(() => {
    if (!loading) {
      Promise.all([fetchNodesList(), fetchSensors()]);
    }
  }, [loading]);
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Chargement...</div>;
  }

  const handleAddOrUpdate = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${BASE_URL}/sensors/${editingId}` : `${BASE_URL}/sensors/`;

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        handleCloseModal();
        fetchSensors();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.detail || "Erreur lors de l'enregistrement"}`);
      }
    } catch {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const confirmDelete = (id) => {
    setSensorToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (sensorToDelete) {
      await fetch(`${BASE_URL}/sensors/${sensorToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      setOpenDeleteDialog(false);
      fetchSensors();
    }
  };

  const startEdit = (sensor) => {
    setEditingId(sensor.id);
    setFormData({
      name: sensor.name || '',
      type: sensor.type || '',
      node_id: sensor.node_id || sensor.nodeId || ''
    });
    setOpenModal(true);
  };

  const handleOpenView = (sensor) => {
    setSelectedSensor(sensor);
    setOpenView(true);
  };

  const handleCloseModal = () => {
    setFormData({ name: '', type: '', node_id: '' });
    setEditingId(null);
    setOpenModal(false);
  };

  const getNodeName = (id) => {
    if (!id) return "Non assigné";
    const node = nodes.find(n => String(n.id) === String(id));
    return node ? node.name : `ID: ${id}`;
  };

  const columns = [
    { field: 'name', headerName: 'Nom', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
    {
      field: 'node_id',
      headerName: 'Nœud',
      flex: 1,
      valueGetter: (value, row) => {
        const id = value || row?.node_id || row?.nodeId;
        return getNodeName(id);
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      renderCell: (params) => (
        <>
          <IconButton color="primary" size="small" onClick={() => handleOpenView(params.row)} title="Voir les détails">
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={() => startEdit(params.row)} sx={{ color: MAIN_BLUE }}>✏️</IconButton>
          <IconButton color="error" onClick={() => confirmDelete(params.row.id)}>🗑️</IconButton>
        </>
      ),
      flex: 1
    }
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

        <div style={{ padding: 20, backgroundColor: '#f5f5f5', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
            <h2 style={{ color: MAIN_BLUE }}>Gestion des Capteurs</h2>
            <Button
              variant="contained"
              onClick={() => setOpenModal(true)}
              sx={{ backgroundColor: MAIN_BLUE, '&:hover': { backgroundColor: '#252d45' } }}
            >
              Ajouter
            </Button>
          </div>

          <div style={{ height: 500, width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <DataGrid
              rows={sensors}
              columns={columns}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } }
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8f9fa', color: MAIN_BLUE, fontWeight: 'bold' }
              }}
            />
          </div>
        </div>
      </div>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, bgcolor: 'white', p: 4, borderRadius: 2, boxShadow: 24
        }}>
          <h3 style={{ color: MAIN_BLUE, marginTop: 0 }}>{editingId ? "Modifier" : "Nouveau"} Capteur</h3>

          <TextField
            fullWidth
            margin="normal"
            label="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <TextField
            select
            fullWidth
            margin="normal"
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            {SENSOR_TYPES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            margin="normal"
            label="Nœud"
            value={formData.node_id}
            onChange={(e) => setFormData({ ...formData, node_id: e.target.value })}
          >
            {nodes.length > 0
              ? nodes.map((n) => (
                  <MenuItem key={n.id} value={n.id}>{n.name}</MenuItem>
                ))
              : <MenuItem disabled>Aucun nœud trouvé</MenuItem>}
          </TextField>

          <Button
            fullWidth
            variant="contained"
            onClick={handleAddOrUpdate}
            sx={{ mt: 2, backgroundColor: MAIN_BLUE, '&:hover': { backgroundColor: '#252d45' } }}
          >
            Enregistrer
          </Button>
        </Box>
      </Modal>
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold', color: MAIN_BLUE, fontSize: '1.2rem', borderBottom: `2px solid ${MAIN_BLUE}` }}>
          Détails du Capteur
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {selectedSensor && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Nom :</Box>
                <Box>{selectedSensor.name}</Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Type :</Box>
                <Box>{selectedSensor.type}</Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Nœud associé :</Box>
                <Box>{getNodeName(selectedSensor.node_id || selectedSensor.nodeId)}</Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenView(false)}
            variant="contained"
            sx={{ backgroundColor: MAIN_BLUE, '&:hover': { backgroundColor: MAIN_BLUE } }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>Supprimer ce capteur ?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Supprimer</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Capteurs;