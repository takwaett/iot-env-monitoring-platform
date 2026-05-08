import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import mdp from '../../assets/mdp.png';

function ChangePassword() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const code = searchParams.get('code'); 
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage("❌ Les mots de passe ne correspondent pas");
            return;
        }

        if (!email || !code) {
            setMessage("❌ Informations de session manquantes. Veuillez recommencer.");
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:8000/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email, 
                    code: code, 
                    newPassword: newPassword 
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('✅ Mot de passe modifié avec succès !');
                setTimeout(() => navigate('/'), 2000); 
            } else {
                setMessage('❌ ' + (data.detail || 'Erreur lors de la modification'));
            }
        } catch (error) {
            setMessage('❌ Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-background">
            <div className="ForgetPassword-container">
                <div className="ForgetPassword-header">
                    <h1>Nouveau mot de passe</h1>
                    <img src={mdp} alt="Logo" className="header-icon" />
                    <p className="slogan">Sécurisez votre compte</p>
                </div>

                {message && (
                    <div style={{ 
                        padding: '10px', margin: '10px 0', borderRadius: '5px',
                        backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
                        color: message.includes('✅') ? '#155724' : '#721c24',
                        textAlign: 'center', fontSize: '14px', fontWeight: 'bold'
                    }}>
                        {message}
                    </div>
                )}

                <form className="ForgetPassword-form" onSubmit={handleChangePassword}>
                    <div className="input-group">
                        <label>Nouveau mot de passe</label>
                        <input
                            type="password"
                            placeholder="********"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Confirmer le mot de passe</label>
                        <input
                            type="password"
                            placeholder="********"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Mise à jour...' : 'Confirmer le changement'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;
