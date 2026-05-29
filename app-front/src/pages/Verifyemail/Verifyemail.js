import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Verifyemail.css';

function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const API_URL = "http://localhost:8000";

  const [email] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // CORRECTION : Changement de /auth/Verifyemail vers /auth/verify-account
      const response = await fetch(`${API_URL}/auth/verify-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      if (response.ok) {
        setMessage('✅ Compte activé ! Redirection...');
        setTimeout(() => navigate('/'), 2000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Code invalide ou expiré.');
      }
    } catch (err) {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      // CORRECTION : Changement de l'URL pour correspondre exactement à ResetEmailRequest du DTO backend
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        setMessage('📩 Nouveau code envoyé !');
        setCanResend(false);
        setTimer(60);
      } else {
        const data = await response.json();
        setError(data.detail || 'Erreur de renvoi.');
      }
    } catch (err) {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inscription-container">
      <form className="inscription-form" onSubmit={handleVerify}>

        <div className="inscription-section">
          <img src={logo} alt="Logo" />
          <h2>EnviroSense</h2>
          <p className="slogan">SMART ENVIRONMENTAL MONITORING</p>
        </div>

        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Saisissez le code envoyé à : <br />
          <strong>{email}</strong>
        </p>

        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}

        <div className="labels">
          <label>Code de vérification (6 chiffres)</label>
          <input
            type="text"
            placeholder="******"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            maxLength="6"
            required
            style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
          />
        </div>

        <button type="submit" className="inscription-btn" disabled={loading || code.length !== 6}>
          {loading ? 'Chargement...' : 'Vérifier'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || loading}
            style={{ background: 'none', border: 'none', color: '#218c74', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {canResend ? "Renvoyer le code" : `Renvoyer dans ${timer}s`}
          </button>
        </div>

        <p className="se-connecter">
          <Link to="/" className="Links">Retour à la page de connexion</Link>
        </p>
      </form>
    </div>
  );
}

export default VerifyEmail;
