import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar/Sidebar';
import Navbar from '../../components/Layout/Navbar/Navbar';
import { DataGrid } from '@mui/x-data-grid';
import { Modal, Box, Button, TextField, MenuItem, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import LoopIcon from '@mui/icons-material/Loop';
import { getUserProfile } from '../../api/auth';
import '../Dashboard/Dashboard.css';

const Noeuds = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    localisation: '',
    statut: 'Online',
    adresseIP: ''
  });

  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL;
  const MAIN_BLUE = "#161c2f";

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const fetchNodes = async () => {
    try {
      const response = await fetch(`${BASE_URL}/nodes/`, { headers: getAuthHeader() });
      if (response.ok) {
        const data = await response.json();
        setNodes(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
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
      fetchNodes();
    }
  }, [loading]);

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

  const handleAddOrUpdate = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${BASE_URL}/nodes/${editingId}` : `${BASE_URL}/nodes/`;

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        handleCloseModal();
        fetchNodes();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.detail || "Erreur base de données"}`);
      }
    } catch {
      alert("Erreur base de données");
    }
  };

  const confirmDelete = (id) => {
    setNodeToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (nodeToDelete) {
      await fetch(`${BASE_URL}/nodes/${nodeToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      setOpenDeleteDialog(false);
      fetchNodes();
    }
  };

  const startEdit = (node) => {
    setEditingId(node.id);
    setFormData(node);
    setOpenModal(true);
  };

  const handleOpenView = (node) => {
    setSelectedNode(node);
    setOpenView(true);
  };

  const handleCloseModal = () => {
    setFormData({ name: '', localisation: '', statut: 'Online', adresseIP: '' });
    setEditingId(null);
    setOpenModal(false);
  };

  const columns = [
    { field: 'name', headerName: 'Nom', flex: 1 },
    { field: 'adresseIP', headerName: 'Adresse IP', flex: 1 },
    { field: 'localisation', headerName: 'Localisation', flex: 1 },
    { field: 'statut', headerName: 'Statut', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <>
          <IconButton color="primary" size="small" onClick={() => handleOpenView(params.row)} title="Voir les détails">
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={() => startEdit(params.row)} sx={{ color: MAIN_BLUE }} title="Modifier">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton color="error" onClick={() => confirmDelete(params.row.id)} title="Supprimer">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
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
          setSearchTerm={() => { }}
        />

        <div style={{ padding: 20, backgroundColor: '#f5f5f5', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
            <h2 style={{ color: MAIN_BLUE }}>Gestion des Nœuds</h2>
            <Button
              variant="contained"
              onClick={() => setOpenModal(true)}
              startIcon={<AddIcon />}
              sx={{ backgroundColor: MAIN_BLUE, '&:hover': { backgroundColor: '#252d45' } }}
            >
              Ajouter
            </Button>
          </div>

          <div style={{ height: 500, width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <DataGrid
              rows={nodes}
              columns={columns}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } }
              }}
              pageSizeOptions={[5, 10, 20]}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8f9fa', color: MAIN_BLUE, fontWeight: 'bold' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #eee' }
              }}
            />
          </div>
        </div>
      </div>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'white', p: 4, borderRadius: 2, boxShadow: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: MAIN_BLUE, marginTop: 0 }}>{editingId ? "Modifier" : "Ajouter"} un nœud</h3>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </div>
          <TextField fullWidth margin="normal" label="Nom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <TextField fullWidth margin="normal" label="Adresse IP" value={formData.adresseIP} onChange={(e) => setFormData({ ...formData, adresseIP: e.target.value })} />
          <TextField fullWidth margin="normal" label="Localisation" value={formData.localisation} onChange={(e) => setFormData({ ...formData, localisation: e.target.value })} />
          <TextField select fullWidth margin="normal" label="Statut" value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value })}>
            <MenuItem value="Online">Online</MenuItem>
            <MenuItem value="Offline">Offline</MenuItem>
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
        <DialogTitle sx={{ fontWeight: 'bold', color: MAIN_BLUE, borderBottom: `2px solid ${MAIN_BLUE}` }}>
          Détails du Nœud
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedNode && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Nom du nœud :</Box>
                <Box>{selectedNode.name}</Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Statut :</Box>
                <Box>{selectedNode.statut}</Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Localisation :</Box>
                <Box>{selectedNode.localisation}</Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ fontWeight: 'bold', minWidth: '130px', color: MAIN_BLUE }}>Adresse IP :</Box>
                <Box>{selectedNode.adresseIP}</Box>
              </Box>

              <Box sx={{ mt: 1 }}>
                <Box sx={{ fontWeight: 'bold', mb: 1, color: MAIN_BLUE }}>Capteurs associés :</Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedNode.sensors && selectedNode.sensors.length > 0 ? (
                    selectedNode.sensors.map((s) => (
                      <Box key={s.id} sx={{ bgcolor: '#e3f2fd', color: '#0d47a1', px: 2, py: 0.5, borderRadius: 5, fontSize: '0.85rem', border: '1px solid #bbdefb' }}>
                        {s.name}
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ fontStyle: 'italic', color: 'gray' }}>Aucun capteur détecté pour ce nœud.</Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenView(false)} variant="contained" sx={{ backgroundColor: MAIN_BLUE }}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>Voulez-vous vraiment supprimer ce nœud ?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Noeuds;