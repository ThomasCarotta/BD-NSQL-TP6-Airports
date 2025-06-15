// Sidebar.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Sidebar({ onNearbySelect }) {
  const [popularAirports, setPopularAirports] = useState([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("");
  const [nearby, setNearby] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/airports/popular")
      .then(res => {
        setPopularAirports(res.data.popular);
      })
      .catch(err => console.error("❌ Error al obtener populares:", err));
  }, []);

  const handleSearchNearby = () => {
    if (!lat || !lng || !radius) return alert("Completa lat, lng y radio.");

    axios.get("http://localhost:8000/airports/nearby", {
      params: { lat, lng, radius }
    })
    .then(res => {
      setNearby(res.data.nearby);
      onNearbySelect(res.data.nearby);
    })
    .catch(err => console.error("❌ Error en búsqueda cercana:", err));
  };

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">🌍 Aeropuertos</h2>

      <div>
        <h4 className="sidebar-subtitle">🔝 Más Populares</h4>
        <ul className="sidebar-list">
          {popularAirports.map(([iata, count], idx) => (
            <li key={idx}>{iata} - {count} visitas</li>
          ))}
        </ul>
      </div>

      <hr className="sidebar-divider" />

      <div>
        <h4 className="sidebar-subtitle">📍 Buscar Cercanos</h4>
        <input type="text" className="sidebar-input" placeholder="Latitud" value={lat} onChange={e => setLat(e.target.value)} />
        <input type="text" className="sidebar-input" placeholder="Longitud" value={lng} onChange={e => setLng(e.target.value)} />
        <input type="text" className="sidebar-input" placeholder="Radio en km" value={radius} onChange={e => setRadius(e.target.value)} />
        <button className="sidebar-button" onClick={handleSearchNearby}>Buscar</button>

        {nearby.length > 0 && (
          <div>
            <h5 className="sidebar-subtitle">Resultados:</h5>
            <ul className="sidebar-list">
              {nearby.map((iata, idx) => <li key={idx}>{iata}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
