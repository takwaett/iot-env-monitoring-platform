import logo from './assets/logo.png';
import { useState } from 'react';
import Login from './pages/Signin/signin';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Inscription from './pages/Signup/signup';
import Dashboard from './pages/Dashboard/Dashboard';
import ForgetPassword from './pages/ForgetPassword/ForgetPassword';
import Satellite from './pages/Satellite/Satellite'
import Alertes from './pages/Alertes/Alertes';
import Noeuds from './pages/Noeuds/noeuds';
import Rapports from './pages/Rapports/Rapports';
import Capteurs from './pages/sensors/sensors';
import Historique from './pages/Historique/Historique';
import ChangePassword from './pages/changepassword/changepassword';
import Gaz from './pages/Gaz/gaz';


import Seuils from './pages/Seuils/seuils';
import User from './pages/User/User';
import Notification from './components/Notification/Notification';
import VerifyCode from './pages/Verifycode/Verifycode';
import VerifyEmail from './pages/Verifyemail/Verifyemail';

function App() {

  const [userName, setUserName] = useState(localStorage.getItem('userName') || "Utilisateur");


  return (
    <div className="App">
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<Login setUserName={setUserName} />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/Forgot-password" element={<ForgetPassword />} />
          <Route path="/Verifycode" element={<VerifyCode />} />
          <Route path="/ChangePassword" element={<ChangePassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />


          <Route path="/dashboard" element={<Dashboard userName={userName} />} />
          <Route path="/profil" element={<User userName={userName} setUserName={setUserName} />} />

          <Route path="/alertes" element={<Alertes userName={userName} />} />
          <Route path="/historique" element={<Historique userName={userName} />} />
          <Route path="/seuils" element={<Seuils userName={userName} />} />
          <Route path="/nodes" element={<Noeuds userName={userName} />} />
          <Route path="/capteurs" element={<Capteurs userName={userName} />} />
          <Route path="/Satellite" element={<Satellite userName={userName} />} />
          <Route path="/rapports" element={<Rapports userName={userName} />} />
          <Route path="/gaz" element={<Gaz userName={userName} />} />



        </Routes>

      </BrowserRouter>
    </div>
  );
}

export default App;
