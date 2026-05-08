import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar/Sidebar';
import Navbar from '../../components/Layout/Navbar/Navbar';
import { getUserProfile } from '../../api/auth';
import '../Dashboard/Dashboard.css';

function User() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/login');
    } else {
      getUserProfile()
        .then((data) => {
          const userData = {
            nom: data.nom || data.last_name || "",
            prenom: data.prenom || data.first_name || "",
            email: data.email || "",
            role: data.role || data.group || "Utilisateur",
            telephone: data.telephone || data.phone || ""
          };
          setUser(userData);
          setEditedUser(userData);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Erreur récupération profil :", error);
          const tokenData = localStorage.getItem('token');
          if (tokenData) {
            try {
              const base64Url = tokenData.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const decodedData = JSON.parse(atob(base64));
              const userData = {
                nom: decodedData.nom || decodedData.last_name || "",
                prenom: decodedData.prenom || decodedData.first_name || "Utilisateur",
                email: decodedData.email || decodedData.sub || "",
                role: decodedData.role || "Utilisateur",
                telephone: ""
              };
              setUser(userData);
              setEditedUser(userData);
            } catch (decodeErr) {
              console.error("Erreur décodage token:", decodeErr);
            }
          }
          setLoading(false);
        });
    }
  }, [navigate]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedUser({ ...user });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser({ ...user });
    setUpdateMessage('');
  };

  const handleSave = () => {
    setUser({ ...editedUser });
    setIsEditing(false);
    setUpdateMessage("✅ Profil mis à jour avec succès !");
    setTimeout(() => setUpdateMessage(''), 3000);
    localStorage.setItem('userProfile', JSON.stringify(editedUser));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>⏳</div>
          <div>Chargement du profil...</div>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role?.toLowerCase().includes("admin");

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

        <main style={{ 
          padding: '30px', 
          overflowY: 'auto', 
          flex: 1, 
          backgroundColor: '#f8f9fa', 
          minHeight: 'calc(100vh - 64px)' 
        }}>
          <section style={{ marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', color: '#161c2f' }}>👤 Mon Profil</h3>
            <p style={{ margin: 0, color: '#64748b' }}>Gérez vos informations personnelles et vos paramètres de sécurité</p>
          </section>

          {updateMessage && (
            <div style={{ 
              background: '#dcfce7', 
              color: '#10b981', 
              padding: '12px 20px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #10b981'
            }}>
              {updateMessage}
            </div>
          )}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '20px' 
          }}>
            <section style={{ 
              background: 'white', 
              padding: '25px', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 2px 5px rgba(0,0,0,0.02)' 
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '20px', color: '#161c2f' }}>
                Informations Personnelles
                {!isEditing && (
                  <button 
                    onClick={handleEdit}
                    style={{
                      marginLeft: '15px',
                      padding: '4px 12px',
                      background: '#e2e8f0',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✏️ Modifier
                  </button>
                )}
              </h4>
              
              {!isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b' }}>Nom</label>
                    <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: '500' }}>
                      {user?.nom || "-"}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b' }}>Prénom</label>
                    <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: '500' }}>
                      {user?.prenom || "-"}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b' }}>Email</label>
                    <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: '500' }}>
                      {user?.email || "-"}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b' }}>Téléphone</label>
                    <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: '500' }}>
                      {user?.telephone || "-"}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px', display: 'block' }}>Nom</label>
                    <input 
                      type="text" 
                      name="nom"
                      value={editedUser?.nom || ''} 
                      onChange={handleChange} 
                      style={{ 
                        padding: '10px', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        width: '100%'
                      }} 
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px', display: 'block' }}>Prénom</label>
                    <input 
                      type="text" 
                      name="prenom"
                      value={editedUser?.prenom || ''} 
                      onChange={handleChange} 
                      style={{ 
                        padding: '10px', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        width: '100%'
                      }} 
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px', display: 'block' }}>Email</label>
                    <input 
                      type="email" 
                      name="email"
                      value={editedUser?.email || ''} 
                      onChange={handleChange} 
                      style={{ 
                        padding: '10px', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        width: '100%'
                      }} 
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px', display: 'block' }}>Téléphone</label>
                    <input 
                      type="tel" 
                      name="telephone"
                      value={editedUser?.telephone || ''} 
                      onChange={handleChange} 
                      style={{ 
                        padding: '10px', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        width: '100%'
                      }} 
                      placeholder="Optionnel"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button 
                      type="button"
                      onClick={handleCancel}
                      style={{ 
                        padding: '10px', 
                        background: '#e2e8f0', 
                        color: '#334155', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        flex: 1
                      }}
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      style={{ 
                        padding: '10px', 
                        background: '#161c2f', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        flex: 1
                      }}
                    >
                      💾 Enregistrer
                    </button>
                  </div>
                </form>
              )}
            </section>
            <section style={{ 
              background: 'white', 
              padding: '25px', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 2px 5px rgba(0,0,0,0.02)' 
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '20px', color: '#161c2f' }}>Sécurité & Compte</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Rôle actuel</span>
                  <p style={{ margin: '5px 0', fontWeight: 'bold', fontSize: '16px' }}>
                    {user?.role || "Utilisateur"} {isAdmin && "🛡️"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Email</span>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>{user?.email || "-"}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Téléphone</span>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>{user?.telephone || "-"}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Statut :</span>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '11px', 
                    background: '#dcfce7', 
                    color: '#10b981', 
                    fontWeight: 'bold' 
                  }}>
                    ACTIF
                  </span>
                </div>
                <div style={{ 
                  marginTop: '15px', 
                  padding: '12px', 
                  background: '#f8fafc', 
                  borderRadius: '8px', 
                  border: '1px dashed #cbd5e1', 
                  fontSize: '12px' 
                }}>
                  🔐 <strong>Sécurité :</strong> Votre compte est protégé.
                </div>
                {isAdmin && (
                  <div style={{ 
                    marginTop: '5px', 
                    padding: '12px', 
                    background: '#fef3c7', 
                    borderRadius: '8px', 
                    border: '1px dashed #f59e0b', 
                    fontSize: '12px',
                    color: '#92400e'
                  }}>
                    <strong>Note admin :</strong> Vous avez accès à tous les réglages système.
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default User;