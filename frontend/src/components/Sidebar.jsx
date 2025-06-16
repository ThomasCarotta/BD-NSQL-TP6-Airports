import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Sidebar({ onNearbySelect, onPopularSelect }) {
  const [popularAirports, setPopularAirports] = useState([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState(50);
  const [nearby, setNearby] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAirport, setSelectedAirport] = useState(null);

  // Cargar y actualizar aeropuertos populares
  const fetchPopularAirports = async () => {
    setLoadingPopular(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:8000/airports/popular");
      const formattedPopular = res.data.popular.map(item => ({
        iata: item[0],
        visits: Math.round(item[1])
      }));
      setPopularAirports(formattedPopular);
    } catch (err) {
      console.error("❌ Error al obtener populares:", err);
      setError("Error al cargar aeropuertos populares");
    } finally {
      setLoadingPopular(false);
    }
  };

  // Cargar inicialmente y cada vez que se selecciona un aeropuerto
  useEffect(() => {
    fetchPopularAirports();
  }, [selectedAirport]);

  // Manejar selección de aeropuerto (actualiza popularidad)
  const handleAirportSelect = async (iata) => {
    try {
      // 1. Registrar la visita en el backend (incrementa popularidad)
      await axios.get(`http://localhost:8000/airports/${iata}`);
      
      // 2. Actualizar el estado para forzar re-render
      setSelectedAirport(iata);
      
      // 3. Notificar al componente padre si es necesario
      if (onPopularSelect) onPopularSelect(iata);
    } catch (err) {
      console.error(`❌ Error al seleccionar aeropuerto ${iata}:`, err);
      setError("Error al registrar visita");
    }
  };

  // Buscar aeropuertos cercanos
  const handleSearchNearby = async () => {
    if (!lat || !lng) {
      setError("Por favor ingresa latitud y longitud");
      return;
    }

    setLoadingNearby(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:8000/airports/nearby", {
        params: { 
          lat: parseFloat(lat), 
          lng: parseFloat(lng), 
          radius: parseFloat(radius) 
        }
      });
      
      setNearby(res.data.nearby);
      if (onNearbySelect) onNearbySelect(res.data.nearby);
    } catch (err) {
      console.error("❌ Error en búsqueda cercana:", err);
      setError("Error al buscar aeropuertos cercanos");
    } finally {
      setLoadingNearby(false);
    }
  };

  return (
    <div className="sidebar" style={{
      width: '300px',
      padding: '20px',
      background: '#f5f5f5',
      borderRight: '1px solid #ddd',
      height: '100vh',
      overflowY: 'auto'
    }}>
      <h2 style={{ marginTop: 0 }}>🌍 Aeropuertos</h2>

      {/* Sección de Aeropuertos Populares */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>🔝 Más Populares</h4>
        {loadingPopular ? (
          <p>Cargando...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {popularAirports.map((airport, idx) => (
              <li 
                key={`${airport.iata}-${idx}`} 
                style={{ 
                  padding: '8px', 
                  margin: '5px 0', 
                  background: selectedAirport === airport.iata ? '#e3f2fd' : '#fff', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => handleAirportSelect(airport.iata)}
              >
                <span style={{ fontWeight: 'bold' }}>{airport.iata}</span>
                <span>{airport.visits} visitas</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '20px 0' }} />

      {/* Sección de Búsqueda Cercana */}
      <div>
        <h4 style={{ marginBottom: '10px' }}>📍 Buscar Cercanos</h4>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Latitud:</label>
          <input 
            type="number" 
            step="any"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            placeholder="Ej: -34.6037"
            value={lat}
            onChange={e => setLat(e.target.value)}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Longitud:</label>
          <input 
            type="number" 
            step="any"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            placeholder="Ej: -58.3816"
            value={lng}
            onChange={e => setLng(e.target.value)}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Radio (km):</label>
          <input 
            type="number" 
            min="1"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            value={radius}
            onChange={e => setRadius(e.target.value)}
          />
        </div>
        
        <button 
          style={{
            width: '100%',
            padding: '10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px',
            transition: 'opacity 0.2s',
            opacity: loadingNearby ? 0.7 : 1
          }}
          onClick={handleSearchNearby}
          disabled={loadingNearby}
        >
          {loadingNearby ? 'Buscando...' : 'Buscar Aeropuertos Cercanos'}
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {nearby.length > 0 && (
          <div>
            <h5 style={{ marginBottom: '10px' }}>Aeropuertos cercanos:</h5>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {nearby.map((iata, idx) => (
                <li 
                  key={idx} 
                  style={{ 
                    padding: '8px', 
                    margin: '5px 0', 
                    background: '#fff', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => handleAirportSelect(iata)}
                >
                  {iata}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}