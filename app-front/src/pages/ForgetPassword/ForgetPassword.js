import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import mdp from '../../assets/mdp.png'; 
import './ForgetPassword.css'; 

function ForgetPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!email) {
            setMessage('❌ Veuillez entrer votre email');
            return;
        }
        
        setLoading(true);
        setMessage('');
        
        try {
            const response = await fetch(process.env.REACT_APP_API_URL+'/auth/send-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            
            const data = await response.json();

            if (response.status === 404) {
                setMessage('❌ Email not found');
            } else if (response.ok) {

                navigate(`/Verifycode?email=${email}`);
            } else {
                setMessage('❌ ' + (data.detail || 'Erreur lors de l\'envoi'));
            }
        } catch (error) {
            setMessage('❌ Erreur: Serveur injoignable');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-background">
            <div className="ForgetPassword-container">
                <div className="ForgetPassword-header">
                    <h1>Mot de passe oublié</h1>
                    <img src={mdp} alt="Logo" className="header-icon" />
                    <p className="slogan">Réinitialisez votre mot de passe</p>
                </div>
                {message && (
                    <div style={{ 
                        padding: '10px', 
                        margin: '10px 0', 
                        borderRadius: '5px',
                        backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
                        color: message.includes('✅') ? '#155724' : '#721c24',
                        textAlign: 'center', 
                        fontSize: '14px', 
                        fontWeight: 'bold'
                    }}>
                        {message}
                    </div>
                )}

                <form className="ForgetPassword-form" onSubmit={handleSendCode}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Envoi en cours...' : 'Envoyer le code'}
                    </button>
                    
                    <Link to="/" className="retour">Retour à la page de connexion</Link>
                </form>
            </div>
        </div>
    );
}

export default ForgetPassword;
