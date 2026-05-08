import React, { useState, useEffect } from 'react';
import './Body.css';
import { getDashboardStats } from '../../../api/auth';
import Graphes from '../../Graphes/Graphes';
import MeteoJour from '../../Layout/MeteoJour/MeteoJour'; 
import { Grid, Box, Typography, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CloseIcon from '@mui/icons-material/Close';

function Body() {
    const [stats, setStats] = useState({ total_noeuds: 0, actifs: 0, capteurs: 0, alertes_danger: 0 });
    const [alertes, setAlertes] = useState([]);
    const [alerteData, setAlerteData] = useState([]);
    const [selectedAlerte, setSelectedAlerte] = useState(null);

    const BASE_URL = "http://localhost:8000";

    useEffect(() => {
        getDashboardStats().then(setStats).catch(console.error);

        const fetchAlertData = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${BASE_URL}/alerts/danger`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAlertes(data.slice(0, 10));

                    const hoursMap = {};
                    for (let i = 0; i < 24; i++) {
                        hoursMap[`${i.toString().padStart(2, '0')}h`] = 0;
                    }

                    data.forEach(alerte => {
                        const dateAlerte = new Date(alerte.created_at);
                        const h = dateAlerte.getHours().toString().padStart(2, '0') + 'h';
                        if (hoursMap[h] !== undefined) {
                            hoursMap[h] += 1;
                        }
                    });

                    setAlerteData(Object.keys(hoursMap).map(h => ({ h, nb: hoursMap[h] })));
                }
            } catch (err) { console.error("Erreur alertes:", err); }
        };

        fetchAlertData();
        const interval = setInterval(fetchAlertData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard-body" style={{ padding: '25px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            
            {/* 1. SECTION KPI (LES 4 CARTES) */}
            <div className="kpi-grid">
                {[
                    { id: 'blue', icon: '🌐', title: 'Nombre total de Nœuds', value: stats.total_noeuds, sub: 'Tous les nœuds existants' },
                    { id: 'green', icon: '✅', title: 'Nœuds Actifs', value: stats.actifs, sub: 'Actuellement en ligne' },
                    { id: 'purple', icon: '📡', title: 'Nombre de Capteurs', value: stats.capteurs, sub: 'Capteurs opérationnels' },
                    { id: 'red', icon: '🚨', title: 'Alertes Danger', value: stats.alertes_danger, sub: 'Nécessitent une action' }
                ].map((item, idx) => (
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

            {/* 2. CARTE MÉTÉO - PLEINE LARGEUR */}
            <Box sx={{ width: '100%', mb: 3 }}>
                <MeteoJour />
            </Box>

            {/* 3. SECTION ALERTES - COURBE D'ALERTES + LISTE D'ALERTES (MÊME HAUTEUR) */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3, height: '480px' }}>
                {/* GRAPHIQUE VOLUME D'ALERTES */}
                <Box sx={{ flex: 1, minWidth: 0, height: '100%' }}>
                    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: '#64748b' }}>VOLUME D'ALERTES / HEURE</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={alerteData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="h" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} allowDecimals={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="nb" stroke="#ef4444" strokeWidth={3} fill="url(#colorRed)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Box>

                {/* LISTE DES ALERTES - MÊME HAUTEUR QUE LA COURBE */}
                <Box sx={{ width: '380px', minWidth: '380px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="card alert-list-card" style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: 0, 
                        overflow: 'hidden',
                        height: '100%'
                    }}>
                        {/* TITRE FIXE */}
                        <div className="alert-list-header" style={{ 
                            padding: '16px 20px', 
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: 'white',
                            position: 'sticky',
                            top: 0,
                            zIndex: 10,
                            borderTopLeftRadius: '20px',
                            borderTopRightRadius: '20px'
                        }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b' }}>10 DERNIÈRES ALERTES</Typography>
                        </div>
                        
                        {/* CONTENU SCROLLABLE */}
                        <div className="alert-list-content" style={{ 
                            flex: 1, 
                            overflowY: 'auto', 
                            padding: '16px'
                        }}>
                            {alertes.map((a) => (
                                <Box key={a.id} onClick={() => setSelectedAlerte(a)}
                                    sx={{ p: 1.2, mb: 1.2, borderRadius: '12px', bgcolor: '#fff5f5', border: '1px solid #fee2e2', cursor: 'pointer', '&:hover': { bgcolor: '#fecaca' } }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#991b1b', fontSize: '0.85rem' }}>{a.message}</Typography>
                                    <Typography variant="caption" sx={{ color: '#dc2626', display: 'block' }}>
                                        {new Date(a.created_at).toLocaleTimeString()} — {a.node?.name || "Station"}
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

            {/* 4. COURBES DES CAPTEURS (Température, Humidité, Qualité de l'air, Pression) - APRÈS LES ALERTES */}
            <Box sx={{ width: '100%', mt: 3 }}>
                <Graphes />
            </Box>

            {/* POPUP DÉTAILS ALERTES */}
            <Dialog open={!!selectedAlerte} onClose={() => setSelectedAlerte(null)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Détails de l'Alerte <IconButton onClick={() => setSelectedAlerte(null)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedAlerte && (
                        <Box>
                            <Typography sx={{ mb: 1 }}><strong>Date :</strong> {new Date(selectedAlerte.created_at).toLocaleString()}</Typography>
                            <Typography sx={{ mb: 1 }}><strong>Nœud :</strong> {selectedAlerte.node?.name || "N/A"}</Typography>
                            <Typography sx={{ mb: 1 }}><strong>Capteur :</strong> {selectedAlerte.sensor?.type || "N/A"}</Typography>
                            <Typography sx={{ color: '#ef4444', fontWeight: 800, mt: 2 }}>{selectedAlerte.message}</Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Body;