
import React, { useState, useEffect } from 'react';
import './Body.css';
import axios from 'axios';
import Graphes from '../../Graphes/Graphes';
import MeteoJour from '../../Layout/MeteoJour/MeteoJour';
import { Box, Typography, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SensorsIcon from '@mui/icons-material/Sensors';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

function Body() {
    const [stats, setStats] = useState({ total_noeuds: 0, actifs: 0, capteurs: 0, alertes_danger: 0 });
    const [alertes, setAlertes] = useState([]);
    const [alerteData, setAlerteData] = useState([]);
    const [selectedAlerte, setSelectedAlerte] = useState(null);
    const [currentUserEmail, setCurrentUserEmail] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    // Fonction pour obtenir le token
    const getToken = () => localStorage.getItem('token');

    // Fonction pour charger les données de l'utilisateur courant
    const loadUserData = async () => {
        const token = getToken();
        if (!token) return;

        try {
            // 1. Récupérer d'abord le profil utilisateur courant
            const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const currentUser = profileResponse.data;
            const userEmail = currentUser.email;

            // Si l'utilisateur a changé, on recharge TOUTES les données
            if (currentUserEmail && currentUserEmail !== userEmail) {
                console.log("🔄 Changement d'utilisateur détecté, rechargement...");
            }

            setCurrentUserEmail(userEmail);

            // 2. Charger les stats (maintenant filtrées par backend)
            const statsResponse = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(statsResponse.data);

            // 3. Charger les alertes (maintenant filtrées par backend)
            const alertsResponse = await axios.get(`${API_BASE_URL}/dashboard/alerts/danger`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const alerts = alertsResponse.data;
            setAlertes(alerts.slice(0, 10));

            // 4. Calculer les statistiques horaires
            const hoursMap = {};
            for (let i = 0; i < 24; i++) {
                hoursMap[`${i.toString().padStart(2, '0')}h`] = 0;
            }

            alerts.forEach(alerte => {
                if (alerte.created_at) {
                    const dateAlerte = new Date(alerte.created_at);
                    const h = dateAlerte.getHours().toString().padStart(2, '0') + 'h';
                    if (hoursMap[h] !== undefined) {
                        hoursMap[h] += 1;
                    }
                }
            });

            setAlerteData(Object.keys(hoursMap).map(h => ({ h, nb: hoursMap[h] })));

        } catch (error) {
            console.error("Erreur chargement données:", error);
            if (error.response?.status === 401) {
                // Token invalide, rediriger vers login
                localStorage.clear();
                window.location.href = '/login';
            }
        }
    };

    useEffect(() => {
        // Charger les données au montage
        loadUserData();

        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(loadUserData, 30000);

        // Écouter les changements de localStorage (déconnexion/reconnexion)
        const handleStorageChange = (e) => {
            if (e.key === 'token') {
                if (!e.newValue) {
                    // Déconnexion
                    window.location.href = '/login';
                } else {
                    // Reconnexion - recharger les données
                    loadUserData();
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Configuration des cartes KPI avec leurs icônes
    const kpiCards = [
        { id: 'blue', icon: <LanguageIcon sx={{ fontSize: '24px' }} />, title: 'Nombre total de Nœuds', value: stats.total_noeuds, sub: 'Tous les nœuds existants' },
        { id: 'green', icon: <CheckCircleIcon sx={{ fontSize: '24px' }} />, title: 'Nœuds Actifs', value: stats.actifs, sub: 'Actuellement en ligne' },
        { id: 'purple', icon: <SensorsIcon sx={{ fontSize: '24px' }} />, title: 'Nombre de Capteurs', value: stats.capteurs, sub: 'Capteurs opérationnels' },
        { id: 'red', icon: <WarningIcon sx={{ fontSize: '24px' }} />, title: 'Alertes Danger', value: stats.alertes_danger, sub: 'Nécessitent une action' }
    ];

    return (
        <div className="dashboard-body" style={{ padding: '25px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* KPI Cards */}
            <div className="kpi-grid">
                {kpiCards.map((item, idx) => (
                    <div key={idx} className={`kpi-card-exact ${item.id}`}>
                        <div className="kpi-header-row">
                            <div className="icon-circle">{item.icon}</div>
                            <span className="kpi-title">{item.title}</span>
                        </div>
                        <div className="kpi-body">
                            <p className="kpi-value">{item.value}</p>
                            <span className="kpi-sub">{item.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Météo */}
            <Box sx={{ width: '100%', mb: 3 }}>
                <MeteoJour />
            </Box>

            {/* Alertes */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3, height: '480px' }}>
                {/* Graphique */}
                <Box sx={{ flex: 1, minWidth: 0, height: '100%' }}>
                    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: '#64748b', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <NotificationsActiveIcon sx={{ fontSize: '18px' }} />
                            VOLUME D'ALERTES / HEURE
                        </Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={alerteData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="h" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="nb" stroke="#ef4444" strokeWidth={3} fill="url(#colorRed)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Box>

                {/* Liste Alertes */}
                <Box sx={{ width: '380px', minWidth: '380px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="card alert-list-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '100%' }}>
                        <div className="alert-list-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <NotificationsActiveIcon sx={{ fontSize: '18px' }} />
                                DERNIÈRES ALERTES
                            </Typography>
                        </div>

                        <div className="alert-list-content" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                            {alertes.map((a) => (
                                <Box key={a.id} onClick={() => setSelectedAlerte(a)}
                                    sx={{ p: 1.2, mb: 1.2, borderRadius: '12px', bgcolor: '#fff5f5', border: '1px solid #fee2e2', cursor: 'pointer', '&:hover': { bgcolor: '#fecaca' } }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#991b1b', fontSize: '0.85rem' }}>
                                        <WarningIcon sx={{ fontSize: '14px', mr: 0.5, verticalAlign: 'middle' }} />
                                        {a.message}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#dc2626', display: 'block', mt: 0.5 }}>
                                        {a.created_at ? new Date(a.created_at).toLocaleTimeString() : 'N/A'} — {a.node?.name || "Station"}
                                    </Typography>
                                </Box>
                            ))}
                            {alertes.length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                                    Aucune alerte pour le moment
                                </Box>
                            )}
                        </div>
                    </div>
                </Box>
            </Box>

            {/* Graphes */}
            <Box sx={{ width: '100%', mt: 3 }}>
                <Graphes />
            </Box>

            {/* Popup Détails */}
            <Dialog open={!!selectedAlerte} onClose={() => setSelectedAlerte(null)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Détails de l'Alerte
                    <IconButton onClick={() => setSelectedAlerte(null)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedAlerte && (
                        <Box>
                            <Typography sx={{ mb: 1 }}><strong>Date :</strong> {new Date(selectedAlerte.created_at).toLocaleString()}</Typography>
                            <Typography sx={{ mb: 1 }}><strong>Nœud :</strong> {selectedAlerte.node?.name || "N/A"}</Typography>
                            <Typography sx={{ mb: 1 }}><strong>Capteur :</strong> {selectedAlerte.sensor?.type || "N/A"}</Typography>
                            <Typography sx={{ color: '#ef4444', fontWeight: 800, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WarningIcon />
                                {selectedAlerte.message}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Body;