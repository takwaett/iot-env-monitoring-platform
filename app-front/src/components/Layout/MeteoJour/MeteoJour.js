import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import FoggyIcon from '@mui/icons-material/Foggy';
import GrainIcon from '@mui/icons-material/Grain';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import AirIcon from '@mui/icons-material/Air';
import WarningIcon from '@mui/icons-material/Warning';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LoopIcon from '@mui/icons-material/Loop';

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

    const getWeatherIcon = (code) => {
        const iconStyle = { fontSize: '60px' };

        // Ciel dégagé ou partiellement nuageux
        if (code === 0 || code === 1) return <WbSunnyIcon sx={{ ...iconStyle, color: '#FFD700' }} />;
        // Nuageux
        if (code === 2 || code === 3) return <CloudIcon sx={{ ...iconStyle, color: '#CBD5E1' }} />;
        // Brouillard
        if (code === 45 || code === 48) return <FoggyIcon sx={{ ...iconStyle, color: '#94A3B8' }} />;
        // Pluie
        if (code >= 51 && code <= 67) return <GrainIcon sx={{ ...iconStyle, color: '#60A5FA' }} />;
        // Neige
        if (code >= 71 && code <= 87) return <AcUnitIcon sx={{ ...iconStyle, color: '#93C5FD' }} />;
        // Averses
        if (code >= 80 && code <= 82) return <GrainIcon sx={{ ...iconStyle, color: '#3B82F6' }} />;
        // Chutes de neige
        if (code >= 85 && code <= 86) return <AcUnitIcon sx={{ ...iconStyle, color: '#BFDBFE' }} />;
        // Orages
        if (code >= 90 && code <= 99) return <ThunderstormIcon sx={{ ...iconStyle, color: '#F59E0B' }} />;
        // Par défaut
        return <ThermostatIcon sx={{ ...iconStyle, color: '#F97316' }} />;
    };

    if (loading) return (
        <div className="card" style={{ color: '#64748b', padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
            <LoopIcon sx={{ fontSize: '20px', animation: 'spin 1s linear infinite' }} />
            Chargement météo...
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );

    if (error) return (
        <div className="card" style={{ color: '#dc2626', padding: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <WarningIcon sx={{ fontSize: '20px' }} />
            {error}
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
                    <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ThermostatIcon sx={{ fontSize: '32px', color: '#F97316' }} />
                        {weather.temp}°C
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', mt: 0.5 }}>
                        <LocationOnIcon sx={{ fontSize: '14px', opacity: 0.7 }} />
                        {weather.location}
                    </Typography>
                </Box>
                <div>
                    {getWeatherIcon(weather.weatherCode)}
                </div>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <OpacityIcon sx={{ fontSize: '14px' }} />
                    Humidité: {weather.humidity}%
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AirIcon sx={{ fontSize: '14px' }} />
                    Vent: {weather.windSpeed} km/h
                </Typography>
            </Box>
        </div>
    );
};

export default MeteoJour;