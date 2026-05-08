import axios from 'axios';
const API_URL = "http://localhost:8000"; 

export const login = async (email, password) => {
    try {
        const params = new URLSearchParams();
        params.append('username', email); 
        params.append('password', password);

        const response = await axios.post(`${API_URL}/auth/login`, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data; 
    } catch (error) {
        console.error("Erreur login:", error.response?.data || error.message);
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        return response.data;
    } catch (error) {
        console.error("Erreur inscription:", error.response?.data || error.message);
        throw error;
    }
};

export const getUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data; 
    } catch (error) {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
        }
        return null;
    }
};

export const getDashboardStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return { total_noeuds: 0, actifs: 0, capteurs: 0, alertes_danger: 0 };

    try {
        const response = await axios.get(`${API_URL}/dashboard/stats`, {
            headers: { 
                Authorization: `Bearer ${token}` 
            }
        });
        return response.data;
    } catch (error) {
        console.error("Erreur stats dashboard:", error.response?.data || error.message);
        return { total_noeuds: 0, actifs: 0, capteurs: 0, alertes_danger: 0 };
    }
};
