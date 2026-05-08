import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import mdp from '../../assets/mdp.png';

function VerifyCode() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email'); 
    const navigate = useNavigate();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:8000/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email, 
                    code: code 
                })
            });

            if (response.ok) {
                navigate(`/ChangePassword?email=${email}&code=${code}`);
            } else {
                const data = await response.json();
                setMessage('❌ ' + (data.detail || 'Le code saisi est incorrect'));
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
                    <h1>Vérification</h1>
                    <img src={mdp} alt="Logo" className="header-icon" />
                    <p className="slogan">Entrez le code reçu par email</p>
                </div>

                {message && (
                    <div style={{ 
                        padding: '10px', margin: '10px 0', borderRadius: '5px',
                        backgroundColor: '#f8d7da', color: '#721c24',
                        textAlign: 'center', fontSize: '14px', fontWeight: 'bold'
                    }}>
                        {message}
                    </div>
                )}

                <form className="ForgetPassword-form" onSubmit={handleVerify}>
                    <div className="input-group">
                        <label>Code de vérification</label>
                        <input
                            type="text"
                            placeholder="******"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Vérification...' : 'Vérifier le code'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default VerifyCode;
