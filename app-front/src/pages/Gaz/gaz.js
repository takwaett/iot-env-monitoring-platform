import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

import {
    RefreshCw,
    Info,
    Activity,
    AlertTriangle,
    CheckCircle,
    ShieldAlert
} from 'lucide-react';

import "./gaz.css";

import Sidebar from '../../components/Layout/Sidebar/Sidebar';
import Navbar from '../../components/Layout/Navbar/Navbar';

import { getUserProfile } from '../../api/auth';

/* ===================== POPUP IMAGE ===================== */
// Ligne 30 CORRIGÉE
import gazTable from '../../assets/gazTable.png';



// Configuration
const GAS_CONFIG = {
    NH3: {
        title: "Ammoniac (NH3)",
        subtitle: "Gaz irritant • Sanitaires, élevage",
        unit: "ppm",
        oms: "OMS: 0.2 ppm (24h)",
        osha: "OSHA: 25 ppm (8h)",
        color: "#10b981",
        icon: Activity,
        getAlert: (v) =>
            v <= 0.2
                ? { label: "Bon", cl: "badge-green" }
                : v <= 25
                    ? { label: "Moyen", cl: "badge-orange" }
                    : { label: "Élevé", cl: "badge-red" }
    },

    NOx: {
        title: "Oxydes d'azote (NOx)",
        subtitle: "Pollution moteurs, combustion",
        unit: "ppm",
        oms: "OMS: 0.05 ppm (24h)",
        osha: "OSHA: 25 ppm (8h)",
        color: "#f59e0b",
        icon: Activity,
        getAlert: (v) =>
            v <= 0.05
                ? { label: "Bon", cl: "badge-green" }
                : v <= 3
                    ? { label: "Moyen", cl: "badge-orange" }
                    : { label: "Élevé", cl: "badge-red" }
    },

    Alcool: {
        title: "Alcool (Éthanol)",
        subtitle: "Détection ivresse, hygiène alimentaire",
        unit: "ppm",
        oms: "OMS: 1.0 ppm (8h)",
        osha: "OSHA: 1000 ppm (8h)",
        color: "#ef4444",
        icon: Activity,
        getAlert: (v) =>
            v <= 1.0
                ? { label: "Bon", cl: "badge-green" }
                : v <= 50
                    ? { label: "Moyen", cl: "badge-orange" }
                    : { label: "Élevé", cl: "badge-red" }
    },

    Benzene: {
        title: "Benzène (C₆H₆)",
        subtitle: "Toxique • Cancérigène",
        unit: "ppm",
        oms: "OMS: 0.001 ppm (24h)",
        osha: "OSHA: 1 ppm (8h)",
        color: "#ef4444",
        icon: Activity,
        getAlert: (v) =>
            v <= 0.001
                ? { label: "Bon", cl: "badge-green" }
                : v <= 0.5
                    ? { label: "Moyen", cl: "badge-orange" }
                    : { label: "Élevé", cl: "badge-red" }
    },

    Fumee: {
        title: "Fumée",
        subtitle: "Particules de fumée, combustion",
        unit: "ppm",
        oms: "OMS: 0.15 ppm (24h)",
        osha: "OSHA: 5 ppm (8h)",
        color: "#f59e0b",
        icon: Activity,
        getAlert: (v) =>
            v <= 0.15
                ? { label: "Bon", cl: "badge-green" }
                : v <= 5
                    ? { label: "Moyen", cl: "badge-orange" }
                    : { label: "Élevé", cl: "badge-red" }
    },

    CO2: {
        title: "CO₂ (Dioxyde de carbone)",
        subtitle: "Qualité d'air intérieur",
        unit: "ppm",
        oms: "OMS: 1000 ppm (24h)",
        osha: "OSHA: 5000 ppm (8h)",
        color: "#f59e0b",
        icon: Activity,
        getAlert: (v) =>
            v <= 800
                ? { label: "Bon", cl: "badge-green" }
                : v <= 1200
                    ? { label: "Moyen", cl: "badge-orange" }
                    : { label: "Élevé", cl: "badge-red" }
    }
};

function Gaz() {

    const navigate = useNavigate();

    const [gasData, setGasData] = useState({});
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ✅ POPUP STATE AJOUTÉ
    const [openInfo, setOpenInfo] = useState(false);

    const BASE_URL = "http://localhost:8000";

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    useEffect(() => {

        const token = localStorage.getItem("token");

        if (!token) {
            navigate('/login');
        } else {

            getUserProfile()
                .then(setUser)
                .catch(() => navigate('/login'))
                .finally(() => setLoading(false));
        }

    }, [navigate]);
    const loadGasDashboard = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/');
            return;
        }



        try {
            // ✅ URL corrigée pour correspondre exactement au préfixe /measurements et à la route /gas-dashboard
            const response = await fetch(
                `${BASE_URL}/measurements/gas-dashboard?period=24h`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.ok) {
                const res = await response.json();

                // ✅ Mapping indispensable pour lier les clés InfluxDB aux clés de votre GAS_CONFIG
                if (res.status === "success" && res.data) {
                    const formattedData = {
                        NH3: res.data.NH3?.history_24h || [],
                        NOx: res.data.NOx?.history_24h || [],
                        Alcool: res.data.Alcohol?.history_24h || [],
                        Benzene: res.data.Benzene?.history_24h || [],
                        Fumee: res.data.Smoke?.history_24h || [],
                        CO2: res.data.CO2?.history_24h || []
                    };
                    setGasData(formattedData);
                }
            }

        } catch (err) {
            console.error("Erreur fetch gaz-dashboard:", err);
        }

    }, [navigate]);


    useEffect(() => {
        if (!loading) {
            loadGasDashboard();
            const interval = setInterval(loadGasDashboard, 30000);
            return () => clearInterval(interval);
        }
    }, [loadGasDashboard, loading]);

    if (loading) return <div>Chargement...</div>;

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

                <div className="gaz-page-dark">

                    <header className="gaz-header">
                        <div className="header-left">
                            <Activity className="header-icon" />
                            <div>
                                <h1>Gaz</h1>
                                <p className="header-sub">
                                    Surveillance multi-gaz avec MQ135 – 6 gaz détectés
                                </p>
                            </div>
                        </div>

                        <div className="header-right">
                            <div className="status-indicator">
                                <span className="dot-online"></span>
                                <span>En ligne</span>
                            </div>

                            <button
                                className={`refresh-btn ${isRefreshing ? 'spin' : ''}`}
                                onClick={async () => {
                                    if (isRefreshing) return;

                                    setIsRefreshing(true);

                                    await loadGasDashboard();

                                    setTimeout(() => {
                                        setIsRefreshing(false);
                                    }, 500);
                                }}
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    </header>

                    {/* GRID */}
                    <main className="gaz-grid">

                        {Object.entries(GAS_CONFIG).map(([key, config]) => {

                            const history = gasData[key] || [];

                            const currentVal =
                                history.length > 0
                                    ? history[history.length - 1].value
                                    : 0;

                            const status = config.getAlert(currentVal);

                            const chartData = history.map((p) => ({
                                ...p,
                                formattedTime: new Date(p.time)
                                    .toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                            }));

                            return (
                                <div className="gas-card" key={key}>
                                    <div className="card-top-row">
                                        <div className="gas-title-block">
                                            <div className={`gas-avatar avatar-${key}`}>
                                                {key}
                                            </div>
                                            <div>
                                                <h3>{config.title}</h3>
                                                <p className="gas-subtext">{config.subtitle}</p>
                                            </div>
                                        </div>

                                        <Info size={18} />
                                    </div>

                                    <div className="value-display-row">
                                        <div className="value-number" style={{ color: config.color }}>
                                            {currentVal} <span className="unit-label">{config.unit}</span>
                                        </div>

                                        <span className={`status-badge ${status.cl}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="thresholds-row">
                                        <span>{config.oms}</span>
                                        <span>{config.osha}</span>
                                    </div>

                                </div>
                            );
                        })}

                    </main>

                    {/* FOOTER */}
                    <footer className="gaz-footer-banner">

                        <div className="footer-left-content">

                            <div className="info-lamp-circle">💡</div>

                            <div>
                                <h4>À propos des seuils</h4>
                                <p>
                                    Les seuils sont basés sur OMS et OSHA.
                                </p>
                            </div>

                        </div>

                        {/* ✅ BOUTON POPUP */}
                        <button
                            className="learn-more-btn"
                            onClick={() => setOpenInfo(true)}
                        >
                            En savoir plus
                        </button>

                    </footer>

                </div>
            </div>


            {/* ================= POPUP ================= */}
            {/* ================= POPUP ================= */}
            {/* ================= POPUP ================= */}
            {openInfo && (
                <div
                    onClick={() => setOpenInfo(false)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(0,0,0,0.7)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#0f172a",
                            padding: "12px",
                            borderRadius: "12px",
                            width: "60vw",
                            maxWidth: "700px",
                            maxHeight: "70vh",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center"
                        }}
                    >
                        <img
                            src={gazTable}
                            alt="Table gaz"
                            style={{
                                width: "100%",
                                height: "auto",
                                maxHeight: "65vh",
                                objectFit: "contain",
                                borderRadius: "10px"
                            }}
                        />
                    </div>
                </div>
            )}

        </div>


    );

}

export default Gaz;