import { useState, useEffect } from 'react'; 
import logo from '../../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import './signin.css';
import { login } from '../../api/auth'; 

function Login({ setUserName }) { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); 
    const navigate = useNavigate();

    useEffect(() => {
        // Redirige si déjà connecté
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleSignin = async (e) => {
        e.preventDefault();
        setErrorMessage(''); 
        
        try {
            const data = await login(email, password);
            if (data && data.access_token) {
                // ✅ 1. Nettoyage TOTAL avant de stocker les nouvelles infos
                localStorage.clear();
                
                // ✅ 2. Stockage des nouvelles données
                localStorage.setItem('token', data.access_token);
                
                if (data.user) {
                    localStorage.setItem('userName', data.user.nom);
                    localStorage.setItem('userId', data.user.id); 
                    localStorage.setItem('userEmail', data.user.email); 
                    if (setUserName) setUserName(data.user.nom); 
                }
                
                // ✅ 3. Redirection par window.location pour vider la mémoire React (State/Cache)
                // C'est l'étape cruciale pour ne pas voir les données de l'ancien utilisateur
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.error("Erreur login:", error);
            setErrorMessage("Email ou mot de passe incorrect !");
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSignin}>
                <div className="logo-plateforme">
                    <img src={logo} alt="Logo Plateforme" />
                    <h2>EnviroSense</h2>
                    <p className="slogan">SMART ENVIRONMENTAL MONITORING</p>
                </div>

                {errorMessage && (
                    <div className="error-message" style={{
                        color: '#d32f2f',
                        backgroundColor: '#ffebee',
                        padding: '10px',
                        borderRadius: '5px',
                        marginBottom: '15px',
                        textAlign: 'center',
                        fontSize: '14px'
                    }}>
                        {errorMessage}
                    </div>
                )}

                <div className="labels">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email" 
                        required
                    />
                </div>

                <div className="labels">
                    <label>Mot de passe</label>
                    <input
                        type="password"
                        placeholder="Entrez votre mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password" 
                        required
                    />
                </div>

                <button type="submit" className="login-btn">Connexion</button>

                <div className="links">
                    <Link to="/forgot-password">Mot de passe oublié ?</Link>
                    <p> Pas encore inscrit ? <Link to="/inscription">S'inscrire</Link></p>
                </div>
            </form>
        </div>
    );
}

export default Login;
