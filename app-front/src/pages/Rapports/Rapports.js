import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    RefreshCw,
    Calendar,
    Mail,
    Plus,
    X,
    Download,
    FileText,
    Settings,
    Play,
    AlertCircle
} from 'lucide-react';
import "./Rapports.css";
import Sidebar from '../../components/Layout/Sidebar/Sidebar';
import Navbar from '../../components/Layout/Navbar/Navbar';
import { getUserProfile } from '../../api/auth';

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#3b82f6'
        },
    },
});

// Modal Component pour la configuration
const ConfigModal = ({ type, currentConfig, onClose, onSave }) => {
    const [config, setConfig] = useState({
        time: currentConfig?.time || '08:00',
        day: currentConfig?.day || 'Lundi'
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Configurer le rapport {type === 'daily' ? 'quotidien' : 'hebdomadaire'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="config-form">
                        <div className="form-group">
                            <label>Heure d'envoi :</label>
                            <input
                                type="time"
                                value={config.time}
                                onChange={(e) => setConfig({ ...config, time: e.target.value })}
                            />
                        </div>

                        {type === 'weekly' && (
                            <div className="form-group">
                                <label>Jour d'envoi :</label>
                                <select
                                    value={config.day}
                                    onChange={(e) => setConfig({ ...config, day: e.target.value })}
                                >
                                    <option value="Lundi">Lundi</option>
                                    <option value="Mardi">Mardi</option>
                                    <option value="Mercredi">Mercredi</option>
                                    <option value="Jeudi">Jeudi</option>
                                    <option value="Vendredi">Vendredi</option>
                                    <option value="Samedi">Samedi</option>
                                    <option value="Dimanche">Dimanche</option>
                                </select>
                            </div>
                        )}

                        <div className="info-message">
                            <AlertCircle size={16} />
                            <span>Les modifications seront appliquées à la prochaine exécution planifiée</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Annuler
                    </button>

                    <button className="btn-primary" onClick={() => onSave(config)}>
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

function Rapports() {
    const navigate = useNavigate();
    const BASE_URL = "http://localhost:8000";

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [dailyEnabled, setDailyEnabled] = useState(true);
    const [weeklyEnabled, setWeeklyEnabled] = useState(true);

    const [recipients, setRecipients] = useState([]);
    const [newEmail, setNewEmail] = useState('');

    const [historyRows, setHistoryRows] = useState([]);
    const [filterType, setFilterType] = useState('all');

    // Chargement séparé
    const [isGeneratingDaily, setIsGeneratingDaily] = useState(false);
    const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);

    // Configuration horaire stockée localement
    const [dailyConfig, setDailyConfig] = useState(() => {
        const saved = localStorage.getItem('daily_report_config');
        return saved ? JSON.parse(saved) : { time: '08:00' };
    });

    const [weeklyConfig, setWeeklyConfig] = useState(() => {
        const saved = localStorage.getItem('weekly_report_config');
        return saved ? JSON.parse(saved) : { time: '08:00', day: 'Lundi' };
    });

    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configType, setConfigType] = useState(null);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Auth
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate('/login');
            return;
        }

        getUserProfile()
            .then((data) => {
                setUser(data);
            })
            .catch((err) => {
                console.error(err);
                localStorage.removeItem("token");
                navigate('/login');
            })
            .finally(() => {
                setLoading(false);
            });

    }, [navigate]);

    // Load data
    const loadReportData = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) return;

        try {

            // Load config
            const configResponse = await fetch(`${BASE_URL}/reports/config`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (configResponse.status === 401) {
                navigate('/login');
                return;
            }

            if (configResponse.ok) {
                const configData = await configResponse.json();

                setDailyEnabled(configData.daily_enabled ?? true);
                setWeeklyEnabled(configData.weekly_enabled ?? true);
                setRecipients(configData.recipient_emails ?? []);
            } else {
                console.error("Erreur chargement config:", await configResponse.text());
            }

            // Load history
            const historyResponse = await fetch(`${BASE_URL}/reports/history`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (historyResponse.status === 401) {
                navigate('/login');
                return;
            }

            if (historyResponse.ok) {
                const historyData = await historyResponse.json();

                const formattedRows = (historyData || []).map((item) => ({
                    id: item.id,
                    type: item.type || "daily",
                    period: item.period || "Période inconnue",
                    date: item.date || "-",
                    recipients: item.recipients || "0 destinataire",
                    status: item.status || "Échec",
                    pdf_path: item.pdf_path || null
                }));

                setHistoryRows(formattedRows);

            } else {
                console.error("Erreur chargement historique:", await historyResponse.text());
            }

        } catch (error) {
            console.error("Erreur chargement:", error);
        }

    }, [navigate, BASE_URL]);

    useEffect(() => {
        if (!loading) {
            loadReportData();
        }
    }, [loading, loadReportData]);

    // Update config
    const updateBackendConfig = async (newDaily, newWeekly, newRecipients) => {
        const token = localStorage.getItem("token");

        if (!token) return false;

        try {

            const response = await fetch(`${BASE_URL}/reports/config`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    daily_enabled: newDaily,
                    weekly_enabled: newWeekly,
                    recipient_emails: newRecipients
                })
            });

            if (response.status === 401) {
                navigate('/login');
                return false;
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Erreur update config:", errorData);

                alert("Erreur mise à jour configuration");
                return false;
            }

            return true;

        } catch (error) {
            console.error("Erreur update:", error);
            alert("Erreur serveur");
            return false;
        }
    };

    // Email management
    const handleAddEmail = async (e) => {
        e.preventDefault();

        if (!newEmail.trim()) return;

        const email = newEmail.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            alert("Adresse email invalide");
            return;
        }

        if (recipients.includes(email)) {
            alert("Email déjà ajouté");
            return;
        }

        const updatedRecipients = [...recipients, email];

        setRecipients(updatedRecipients);
        setNewEmail('');

        await updateBackendConfig(
            dailyEnabled,
            weeklyEnabled,
            updatedRecipients
        );
    };

    const handleRemoveEmail = async (emailToRemove) => {
        const updatedRecipients = recipients.filter(
            email => email !== emailToRemove
        );

        setRecipients(updatedRecipients);

        await updateBackendConfig(
            dailyEnabled,
            weeklyEnabled,
            updatedRecipients
        );
    };

    // Generate report
    const triggerTest = async (type) => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate('/login');
            return;
        }

        if (recipients.length === 0) {
            alert("Veuillez d'abord ajouter des destinataires");
            return;
        }

        if (type === 'daily') {
            setIsGeneratingDaily(true);
        } else {
            setIsGeneratingWeekly(true);
        }

        try {

            const response = await fetch(`${BASE_URL}/reports/trigger-test?type=${type}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            if (!response.ok) {

                let errorMessage = "Erreur génération rapport";

                try {
                    const errorData = await response.json();
                    errorMessage =
                        errorData.detail ||
                        errorData.message ||
                        errorMessage;

                } catch (e) {
                    errorMessage = await response.text();
                }

                alert(errorMessage);
                return;
            }

            const result = await response.json();

            alert(result.message || "Rapport généré avec succès");

            await loadReportData();

        } catch (error) {
            console.error("Erreur génération:", error);

            alert("Erreur serveur lors de la génération du rapport");

        } finally {

            if (type === 'daily') {
                setIsGeneratingDaily(false);
            } else {
                setIsGeneratingWeekly(false);
            }
        }
    };

    // Download PDF
    const handleDownload = async (reportId) => {

        if (!reportId) {
            alert("ID du rapport introuvable");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            navigate('/login');
            return;
        }

        try {

            console.log(`Téléchargement du rapport ${reportId}...`);

            const response = await fetch(`${BASE_URL}/reports/download/${reportId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Accept': 'application/pdf'
                }
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            if (response.status === 404) {
                alert("Fichier PDF non trouvé sur le serveur");
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();

                console.error("Erreur téléchargement:", errorText);

                alert(`Téléchargement impossible: ${response.status} ${response.statusText}`);

                return;
            }

            const blob = await response.blob();

            if (blob.size === 0) {
                alert("Le fichier téléchargé est vide");
                return;
            }

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            let filename = `rapport_${reportId}.pdf`;

            const contentDisposition = response.headers.get('Content-Disposition');

            if (contentDisposition) {

                const filenameMatch =
                    contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);

                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            link.download = filename;

            document.body.appendChild(link);

            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            console.log("Téléchargement réussi:", filename);

        } catch (error) {

            console.error("Erreur téléchargement:", error);

            alert(`Erreur lors du téléchargement: ${error.message}`);
        }
    };

    const handleConfigure = (type) => {
        setConfigType(type);
        setShowConfigModal(true);
    };

    // Save config
    const handleSaveConfig = async (config) => {
        try {

            if (configType === 'daily') {
                setDailyConfig(config);

                localStorage.setItem(
                    'daily_report_config',
                    JSON.stringify(config)
                );

            } else {

                setWeeklyConfig(config);

                localStorage.setItem(
                    'weekly_report_config',
                    JSON.stringify(config)
                );
            }

            alert(
                `Configuration ${configType === 'daily'
                    ? 'quotidienne'
                    : 'hebdomadaire'
                } enregistrée avec succès`
            );

            setShowConfigModal(false);

        } catch (error) {

            console.error("Erreur sauvegarde config:", error);

            alert("Erreur lors de la sauvegarde de la configuration");
        }
    };

    // Columns
    const columns = [
        {
            field: 'type',
            headerName: 'Type de rapport',
            flex: 1.2,

            renderCell: (params) => (
                <div className="table-cell-with-icon">
                    <Calendar
                        size={16}
                        className={
                            params.value === 'daily'
                                ? 'icon-blue'
                                : 'icon-purple'
                        }
                    />

                    <span>
                        {
                            params.value === 'daily'
                                ? 'Rapport quotidien'
                                : 'Rapport hebdomadaire'
                        }
                    </span>
                </div>
            )
        },

        {
            field: 'period',
            headerName: 'Période couverte',
            flex: 1.3
        },

        {
            field: 'date',
            headerName: "Date d'envoi",
            flex: 1
        },

        {
            field: 'recipients',
            headerName: 'Destinataires',
            flex: 1
        },

        {
            field: 'status',
            headerName: 'Statut',
            flex: 0.8,

            renderCell: (params) => (
                <span
                    className={`status-badge-grid ${params.value === 'Envoyé'
                        ? 'status-success'
                        : 'status-danger'
                        }`}
                >
                    {params.value}
                </span>
            )
        },

        {
            field: 'actions',
            headerName: 'Actions',
            flex: 0.8,
            sortable: false,

            renderCell: (params) => (
                <div className="table-actions-btns">
                    <button
                        className="grid-action-btn"
                        title="Télécharger"
                        onClick={() => handleDownload(params.row.id)}
                        disabled={params.row.status !== 'Envoyé'}
                    >
                        <Download size={16} />
                    </button>
                </div>
            )
        }
    ];

    const filteredRows = historyRows.filter((row) => {
        if (filterType === 'all') return true;
        return row.type === filterType;
    });

    if (loading) {
        return <div className="loading-screen">Chargement...</div>;
    }

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

                <div className="reports-page-white">

                    <header className="page-title-section">
                        <h1>Rapports automatiques</h1>
                        <p>Gérez les rapports PDF envoyés par email</p>
                    </header>

                    {/* Top Cards */}
                    <section className="top-cards-row">

                        {/* Daily */}
                        <div className="control-card">

                            <div className="card-top-info">

                                <div className="icon-wrapper bg-light-blue">
                                    <Calendar size={20} className="text-blue" />
                                </div>

                                <div className="text-wrapper">
                                    <h3>Rapport quotidien</h3>
                                    <p>Résumé des dernières 24 heures</p>
                                </div>
                            </div>

                            <div className="card-middle-config">

                                <label className="switch-container">

                                    <input
                                        type="checkbox"
                                        checked={dailyEnabled}
                                        onChange={async (e) => {
                                            const value = e.target.checked;

                                            setDailyEnabled(value);

                                            await updateBackendConfig(
                                                value,
                                                weeklyEnabled,
                                                recipients
                                            );
                                        }}
                                    />

                                    <span className="slider"></span>

                                    <span className="switch-label">
                                        {dailyEnabled ? 'Activé' : 'Désactivé'}
                                    </span>
                                </label>

                                <span className="time-indicator">
                                    <RefreshCw size={12} />
                                    Chaque jour à {dailyConfig.time}
                                </span>
                            </div>

                            <div className="card-bottom-actions">

                                <button
                                    className="btn-secondary"
                                    disabled={
                                        isGeneratingDaily ||
                                        recipients.length === 0
                                    }
                                    onClick={() => triggerTest('daily')}
                                >
                                    <Play size={14} />

                                    {
                                        isGeneratingDaily
                                            ? 'Génération...'
                                            : 'Générer un test'
                                    }
                                </button>

                                <button
                                    className="btn-outline"
                                    onClick={() => handleConfigure('daily')}
                                >
                                    <Settings size={14} />
                                    Configurer
                                </button>
                            </div>
                        </div>

                        {/* Weekly */}
                        <div className="control-card">

                            <div className="card-top-info">

                                <div className="icon-wrapper bg-light-purple">
                                    <Calendar size={20} className="text-purple" />
                                </div>

                                <div className="text-wrapper">
                                    <h3>Rapport hebdomadaire</h3>
                                    <p>Résumé des 7 derniers jours</p>
                                </div>
                            </div>

                            <div className="card-middle-config">

                                <label className="switch-container">

                                    <input
                                        type="checkbox"
                                        checked={weeklyEnabled}
                                        onChange={async (e) => {

                                            const value = e.target.checked;

                                            setWeeklyEnabled(value);

                                            await updateBackendConfig(
                                                dailyEnabled,
                                                value,
                                                recipients
                                            );
                                        }}
                                    />

                                    <span className="slider"></span>

                                    <span className="switch-label">
                                        {weeklyEnabled ? 'Activé' : 'Désactivé'}
                                    </span>
                                </label>

                                <span className="time-indicator">
                                    <RefreshCw size={12} />
                                    Chaque {weeklyConfig.day} à {weeklyConfig.time}
                                </span>
                            </div>

                            <div className="card-bottom-actions">

                                <button
                                    className="btn-secondary"
                                    disabled={
                                        isGeneratingWeekly ||
                                        recipients.length === 0
                                    }
                                    onClick={() => triggerTest('weekly')}
                                >
                                    <Play size={14} />

                                    {
                                        isGeneratingWeekly
                                            ? 'Génération...'
                                            : 'Générer un test'
                                    }
                                </button>

                                <button
                                    className="btn-outline"
                                    onClick={() => handleConfigure('weekly')}
                                >
                                    <Settings size={14} />
                                    Configurer
                                </button>
                            </div>
                        </div>

                        {/* Emails */}
                        <div className="control-card">

                            <div className="card-top-info">

                                <div className="icon-wrapper bg-light-green">
                                    <Mail size={20} className="text-green" />
                                </div>

                                <div className="text-wrapper">
                                    <h3>Destinataires</h3>
                                    <p>Emails recevant les rapports</p>
                                </div>
                            </div>

                            <div className="emails-container-list">

                                {
                                    recipients.length === 0 ? (
                                        <div className="no-emails-message">
                                            <AlertCircle size={16} />
                                            <span>Aucun destinataire configuré</span>
                                        </div>
                                    ) : (
                                        recipients.map((email, index) => (
                                            <div className="email-chip" key={index}>
                                                <span>{email}</span>

                                                <X
                                                    size={12}
                                                    className="remove-email-icon"
                                                    onClick={() => handleRemoveEmail(email)}
                                                />
                                            </div>
                                        ))
                                    )
                                }
                            </div>

                            <form
                                onSubmit={handleAddEmail}
                                className="add-email-trigger-form"
                            >

                                <input
                                    type="email"
                                    placeholder="nom@exemple.com"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                />

                                <button type="submit" className="btn-add-chip">
                                    <Plus size={14} />
                                    Ajouter
                                </button>
                            </form>
                        </div>
                    </section>

                    {/* Bottom */}
                    <div className="reports-bottom-workspace">

                        {/* History */}
                        <div className="history-datagrid-container">

                            <div className="datagrid-header-bar">
                                <h2>Historique des rapports</h2>

                                <select
                                    className="datagrid-filter-select"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="all">Tous les types</option>
                                    <option value="daily">Quotidien</option>
                                    <option value="weekly">Hebdomadaire</option>
                                </select>
                            </div>

                            <div className="mui-datagrid-wrapper">

                                <ThemeProvider theme={lightTheme}>

                                    <DataGrid
                                        rows={filteredRows}
                                        columns={columns}
                                        autoHeight
                                        disableRowSelectionOnClick
                                        pageSizeOptions={[5, 10, 20]}
                                        initialState={{
                                            pagination: {
                                                paginationModel: {
                                                    pageSize: 5
                                                }
                                            }
                                        }}
                                        className="custom-material-datagrid"
                                    />
                                </ThemeProvider>
                            </div>
                        </div>

                        {/* Preview Sidebar */}
                        <aside className="preview-report-sidebar">

                            <h2>Aperçu du dernier rapport</h2>

                            {
                                historyRows.length > 0 ? (
                                    <>
                                        <div className="preview-doc-header">

                                            <div className="doc-icon-box">
                                                <FileText
                                                    size={24}
                                                    className="text-green"
                                                />
                                            </div>

                                            <div className="doc-meta">
                                                <h4>{historyRows[0].period}</h4>

                                                <p>
                                                    Envoyé le {historyRows[0].date}
                                                </p>

                                                <p>
                                                    {historyRows[0].recipients}
                                                </p>

                                                <p
                                                    className={`status-text ${historyRows[0].status === 'Envoyé'
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                        }`}
                                                >
                                                    {historyRows[0].status}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            className="btn-primary-download"
                                            onClick={() => handleDownload(historyRows[0].id)}
                                            disabled={historyRows[0].status !== 'Envoyé'}
                                        >
                                            <Download size={16} />
                                            Télécharger le PDF
                                        </button>
                                    </>
                                ) : (
                                    <p>Aucun rapport disponible</p>
                                )
                            }
                        </aside>
                    </div>
                </div>
            </div>

            {/* Config Modal */}
            {
                showConfigModal && (
                    <ConfigModal
                        type={configType}
                        currentConfig={
                            configType === 'daily'
                                ? dailyConfig
                                : weeklyConfig
                        }
                        onClose={() => setShowConfigModal(false)}
                        onSave={handleSaveConfig}
                    />
                )
            }
        </div>
    );
}

export default Rapports;