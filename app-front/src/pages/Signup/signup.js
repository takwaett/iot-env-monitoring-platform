import { useState } from 'react';
import logo from '../../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import './signup.css'; 
import { register } from '../../api/auth'; 

function Inscription() {
    const [Nom, setNom] = useState('');
    const [Prenom, setPrenom] = useState(''); 
    const [Email, setEmail] = useState('');
    // Note: Votre DTO Backend n'a pas de champ téléphone, je le garde en local seulement
    const [NumeroDeTelephone, setNumeroDeTelephone] = useState(''); 
    const [Password, setPassword] = useState('');
    const [ConfirmPassword, setConfirmPassword] = useState(''); 
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Ajout d'un état de chargement
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (Password !== ConfirmPassword) {
            setLoading(false);
            return setError("Les mots de passe ne correspondent pas.");
        }

        // Préparation des données pour correspondre exactement à votre UserCreate DTO
        const userData = {
            nom: Nom,
            prenom: Prenom,
            email: Email,
            motDePasse: Password,
            role: "user" // Valeur par défaut
        };

        try {
            await register(userData);
            
            
            navigate('/verify-email', { state: { email: Email } }); 
            
        } catch (err) {
            setError(err.response?.data?.detail || "Erreur lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="inscription-container">
            <form className="inscription-form" onSubmit={handleRegister}>
                <div className="inscription-section">
                    <img src={logo} alt="Logo Plateforme" />
                    <h2>EnviroSense</h2>
                    <p className="slogan">SMART ENVIRONMENTAL MONITORING</p>
                </div>
               
                {error && <p className="error-text" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                <div className="labels">
                    <label>Nom</label>
                    <input
                        type="text"
                        placeholder="Entrez votre nom"
                        value={Nom}
                        onChange={(e) => setNom(e.target.value)}
                        required
                    />
                </div>
                <div className="labels">
                    <label>Prénom</label>
                    <input
                        type="text"
                        placeholder="Entrez votre prénom"
                        value={Prenom} 
                        onChange={(e) => setPrenom(e.target.value)} 
                        required
                    />
                </div>
                <div className="labels">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Entrez votre email"
                        value={Email} 
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                {/* Champ téléphone (optionnel pour le front, ignoré par le DTO actuel) */}
                <div className="labels">
                    <label>Numéro de téléphone</label>
                    <input
                        type="text"
                        placeholder="Entrez votre numéro de téléphone"
                        value={NumeroDeTelephone} 
                        onChange={(e) => setNumeroDeTelephone(e.target.value)} 
                    />
                </div>
                <div className="labels">
                    <label>Mot de passe</label>
                    <input
                        type="password"
                        placeholder="Entrez votre mot de passe"
                        value={Password} 
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="labels">
                    <label>Confirmer le mot de passe</label>
                    <input
                        type="password"
                        placeholder="Confirmez votre mot de passe"
                        value={ConfirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required
                    />
                </div>
                <div className="checkbox">
                    <input type="checkbox" id="terms" required />
                    <label htmlFor="terms">J'accepte les conditions d'utilisation</label>
                </div>   
                
                <button type="submit" className="inscription-btn" disabled={loading}>
                    {loading ? "Chargement..." : "S'inscrire"}
                </button>
                 
                <p className="se-connecter"> 
                    Déjà inscrit ? <Link to="/" className="Links">Retour à la page de connexion</Link>
                </p>
            </form>
        </div>
    );
}

export default Inscription;
