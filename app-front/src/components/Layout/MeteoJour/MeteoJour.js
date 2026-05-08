import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const MeteoJour = () => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.current) {
                            setWeather({
                                temp: Math.round(data.current.temperature_2m),
                                humidity: data.current.relative_humidity_2m,
                                windSpeed: Math.round(data.current.wind_speed_10m),
                                weatherCode: data.current.weather_code,
                                location: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`
                            });
                        }
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error("Erreur météo:", err);
                        setError("Impossible de charger la météo");
                        setLoading(false);
                    });
            },
            (error) => {
                console.error("Erreur géolocalisation:", error);
                setError("Géolocalisation non disponible");
                setLoading(false);
            }
        );
    }, []);

  
    const getWeatherEmoji = (code) => {
        if (code === 0 || code === 1) return '☀️'; 
        if (code === 2 || code === 3) return '⛅'; 
        if (code === 45 || code === 48) return '🌫️'; 
        if (code >= 51 && code <= 67) return '🌧️'; 
        if (code >= 71 && code <= 87) return '❄️'; 
        if (code >= 80 && code <= 82) return '🌦️'; 
        if (code >= 85 && code <= 86) return '🌨️'; 
        if (code >= 90 && code <= 99) return '⛈️'; 
        return '🌡️';
    };

    if (loading) return (
        <div className="card" style={{ color: '#64748b', padding: '20px' }}>
            Chargement météo...
        </div>
    );

    if (error) return (
        <div className="card" style={{ color: '#dc2626', padding: '20px' }}>
            ⚠️ {error}
        </div>
    );

    if (!weather) return (
        <div className="card" style={{ color: '#64748b', padding: '20px' }}>
            Pas de données météo
        </div>
    );

    return (
        <div className="card" style={{ 
            background: '#1a1f3a', 
            color: 'white',
            padding: '20px'
        }}>
            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9 }}>
                MÉTÉO LOCALE RÉELLE
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {weather.temp}°C
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {weather.location}
                    </Typography>
                </Box>
                <div style={{ fontSize: '60px' }}>
                    {getWeatherEmoji(weather.weatherCode)}
                </div>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Humidité: {weather.humidity}%
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Vent: {weather.windSpeed} km/h
                </Typography>
            </Box>
        </div>
    );
};

export default MeteoJour;