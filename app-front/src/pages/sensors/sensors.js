import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar/Sidebar';
import Navbar from '../../components/Layout/Navbar/Navbar';
import { DataGrid } from '@mui/x-data-grid';

import {
  Modal,
  Box,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton
} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import LoopIcon from '@mui/icons-material/Loop';

import { getUserProfile } from '../../api/auth';

import '../Dashboard/Dashboard.css';

// ================= SENSOR TYPES =================

const SENSOR_TYPES = [
  { label: 'Temperature', value: 'Temperature' },
  { label: 'Pression', value: 'pressure' },
  { label: 'Humidité', value: 'humidity' },
  { label: "Qualité de l'air", value: "Air Quality" },
];

const Capteurs = () => {

  // ================= STATES =================

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

  // ================= CONFIG =================

  const navigate = useNavigate();

  const BASE_URL = process.env.REACT_APP_API_URL;

  const MAIN_BLUE = "#161c2f";

  // ================= SIDEBAR =================

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // ================= AUTH HEADER =================

  const getAuthHeader = () => {

    const token = localStorage.getItem('token');

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // ================= FETCH SENSORS =================

  const fetchSensors = async () => {

    try {

      const response = await fetch(`${BASE_URL}/sensors`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      if (response.ok) {

        const data = await response.json();

        setSensors(
          data.map(sensor => ({
            ...sensor,
            id: sensor.id
          }))
        );

      } else {

        console.error("Erreur récupération capteurs");

      }

    } catch (error) {

      console.error("Erreur capteurs :", error);

    }
  };

  // ================= FETCH NODES =================

  const fetchNodesList = async () => {

    try {

      const response = await fetch(`${BASE_URL}/nodes`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      if (response.ok) {

        const data = await response.json();

        setNodes(data);

      } else {

        console.error("Erreur récupération nœuds");

      }

    } catch (error) {

      console.error("Erreur nœuds :", error);

    }
  };

  // ================= USER PROFILE =================

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

  // ================= LOAD DATA =================

  useEffect(() => {

    if (!loading) {

      Promise.all([
        fetchNodesList(),
        fetchSensors()
      ]);

    }

  }, [loading]);

  // ================= LOADING =================

  if (loading) {

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
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

  // ================= ADD / UPDATE SENSOR =================

  const handleAddOrUpdate = async () => {

    const method = editingId ? 'PUT' : 'POST';

    const url = editingId
      ? `${BASE_URL}/sensors/${editingId}`
      : `${BASE_URL}/sensors`;

    try {

      const response = await fetch(url, {
        method: method,
        headers: getAuthHeader(),
        body: JSON.stringify(formData)
      });

      if (response.ok) {

        handleCloseModal();

        fetchSensors();

      } else {

        const errorData = await response.json();

        console.error(errorData);

        alert(
          `Erreur : ${
            errorData.detail || "Erreur lors de l'enregistrement"
          }`
        );
      }

    } catch (error) {

      console.error("Erreur :", error);

      alert("Impossible de contacter le serveur");

    }
  };

  // ================= DELETE SENSOR =================

  const confirmDelete = (id) => {

    setSensorToDelete(id);

    setOpenDeleteDialog(true);

  };

  const handleDelete = async () => {

    if (!sensorToDelete) return;

    try {

      const response = await fetch(
        `${BASE_URL}/sensors/${sensorToDelete}`,
        {
          method: 'DELETE',
          headers: getAuthHeader()
        }
      );

      if (response.ok) {

        setOpenDeleteDialog(false);

        setSensorToDelete(null);

        fetchSensors();

      } else {

        const errorText = await response.text();

        console.error("Erreur suppression :", errorText);

        alert("Erreur lors de la suppression");

      }

    } catch (error) {

      console.error("Erreur fetch :", error);

      alert("Impossible de contacter le serveur backend");

    }
  };

  // ================= EDIT SENSOR =================

  const startEdit = (sensor) => {

    setEditingId(sensor.id);

    setFormData({
      name: sensor.name || '',
      type: sensor.type || '',
      node_id: sensor.node_id || sensor.nodeId || ''
    });

    setOpenModal(true);

  };

  // ================= VIEW SENSOR =================

  const handleOpenView = (sensor) => {

    setSelectedSensor(sensor);

    setOpenView(true);

  };

  // ================= CLOSE MODAL =================

  const handleCloseModal = () => {

    setFormData({
      name: '',
      type: '',
      node_id: ''
    });

    setEditingId(null);

    setOpenModal(false);

  };

  // ================= GET NODE NAME =================

  const getNodeName = (id) => {

    if (!id) return "Non assigné";

    const node = nodes.find(
      n => String(n.id) === String(id)
    );

    return node ? node.name : `ID: ${id}`;
  };

  // ================= DATAGRID COLUMNS =================

  const columns = [

    {
      field: 'name',
      headerName: 'Nom',
      flex: 1
    },

    {
      field: 'type',
      headerName: 'Type',
      flex: 1
    },

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
      flex: 1,

      renderCell: (params) => (

        <>

          {/* VIEW */}

          <IconButton
            color="primary"
            size="small"
            onClick={() => handleOpenView(params.row)}
            title="Voir les détails"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>

          {/* EDIT */}

          <IconButton
            onClick={() => startEdit(params.row)}
            sx={{ color: MAIN_BLUE }}
            title="Modifier"
          >
            <EditIcon fontSize="small" />
          </IconButton>

          {/* DELETE */}

          <IconButton
            color="error"
            onClick={() => confirmDelete(params.row.id)}
            title="Supprimer"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>

        </>
      )
    }
  ];

  // ================= RENDER =================

  return (

    <div
      className={`dashboard-container ${
        isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'
      }`}
    >

      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN AREA */}

      <div className="main-area">

        {/* NAVBAR */}

        <Navbar
          toggleSidebar={toggleSidebar}
          user={user}
          searchTerm=""
          setSearchTerm={() => {}}
        />

        {/* CONTENT */}

        <div
          style={{
            padding: 20,
            backgroundColor: '#f5f5f5',
            flex: 1
          }}
        >

          {/* HEADER */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 15,
              alignItems: 'center'
            }}
          >

            <h2 style={{ color: MAIN_BLUE }}>
              Gestion des Capteurs
            </h2>

            <Button
              variant="contained"
              onClick={() => setOpenModal(true)}
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: MAIN_BLUE,
                '&:hover': {
                  backgroundColor: '#252d45'
                }
              }}
            >
              Ajouter
            </Button>

          </div>

          {/* TABLE */}

          <div
            style={{
              height: 500,
              width: '100%',
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >

            <DataGrid
              rows={sensors}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10
                  }
                }
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={{
                border: 'none',

                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8f9fa',
                  color: MAIN_BLUE,
                  fontWeight: 'bold'
                }
              }}
            />

          </div>

        </div>

      </div>

      {/* ================= ADD / EDIT MODAL ================= */}

      <Modal
        open={openModal}
        onClose={handleCloseModal}
      >

        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'white',
            p: 4,
            borderRadius: 2,
            boxShadow: 24
          }}
        >

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3
              style={{
                color: MAIN_BLUE,
                marginTop: 0
              }}
            >
              {editingId ? "Modifier" : "Nouveau"} Capteur
            </h3>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </div>

          {/* NAME */}

          <TextField
            fullWidth
            margin="normal"
            label="Nom"
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value
              })
            }
          />

          {/* TYPE */}

          <TextField
            select
            fullWidth
            margin="normal"
            label="Type"
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value
              })
            }
          >

            {SENSOR_TYPES.map((opt) => (

              <MenuItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </MenuItem>

            ))}

          </TextField>

          {/* NODE */}

          <TextField
            select
            fullWidth
            margin="normal"
            label="Nœud"
            value={formData.node_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                node_id: e.target.value
              })
            }
          >

            {nodes.length > 0 ? (

              nodes.map((node) => (

                <MenuItem
                  key={node.id}
                  value={node.id}
                >
                  {node.name}
                </MenuItem>

              ))

            ) : (

              <MenuItem disabled>
                Aucun nœud trouvé
              </MenuItem>

            )}

          </TextField>

          {/* SAVE BUTTON */}

          <Button
            fullWidth
            variant="contained"
            onClick={handleAddOrUpdate}
            sx={{
              mt: 2,
              backgroundColor: MAIN_BLUE,

              '&:hover': {
                backgroundColor: '#252d45'
              }
            }}
          >
            Enregistrer
          </Button>

        </Box>

      </Modal>

      {/* ================= VIEW DIALOG ================= */}

      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        fullWidth
        maxWidth="sm"
      >

        <DialogTitle
          sx={{
            fontWeight: 'bold',
            color: MAIN_BLUE,
            fontSize: '1.2rem',
            borderBottom: `2px solid ${MAIN_BLUE}`
          }}
        >
          Détails du Capteur
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>

          {selectedSensor && (

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >

              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  p: 1.5,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1
                }}
              >

                <Box
                  sx={{
                    fontWeight: 'bold',
                    minWidth: '130px',
                    color: MAIN_BLUE
                  }}
                >
                  Nom :
                </Box>

                <Box>
                  {selectedSensor.name}
                </Box>

              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  p: 1.5,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1
                }}
              >

                <Box
                  sx={{
                    fontWeight: 'bold',
                    minWidth: '130px',
                    color: MAIN_BLUE
                  }}
                >
                  Type :
                </Box>

                <Box>
                  {selectedSensor.type}
                </Box>

              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  p: 1.5,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1
                }}
              >

                <Box
                  sx={{
                    fontWeight: 'bold',
                    minWidth: '130px',
                    color: MAIN_BLUE
                  }}
                >
                  Nœud associé :
                </Box>

                <Box>
                  {
                    getNodeName(
                      selectedSensor.node_id ||
                      selectedSensor.nodeId
                    )
                  }
                </Box>

              </Box>

            </Box>

          )}

        </DialogContent>

        <DialogActions sx={{ p: 2 }}>

          <Button
            onClick={() => setOpenView(false)}
            variant="contained"
            sx={{
              backgroundColor: MAIN_BLUE,

              '&:hover': {
                backgroundColor: MAIN_BLUE
              }
            }}
          >
            Fermer
          </Button>

        </DialogActions>

      </Dialog>

      {/* ================= DELETE DIALOG ================= */}

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >

        <DialogTitle>
          Confirmation
        </DialogTitle>

        <DialogContent>

          <DialogContentText>
            Supprimer ce capteur ?
          </DialogContentText>

        </DialogContent>

        <DialogActions sx={{ p: 2 }}>

          <Button
            onClick={() => setOpenDeleteDialog(false)}
          >
            Annuler
          </Button>

          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
          >
            Supprimer
          </Button>

        </DialogActions>

      </Dialog>

    </div>
  );
};

export default Capteurs;