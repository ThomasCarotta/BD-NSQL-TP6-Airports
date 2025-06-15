import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster/dist/MarkerCluster.css";

// Fix para íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function AirportMap() {
  const [airports, setAirports] = useState([]);
  const [popupData, setPopupData] = useState({});

  useEffect(() => {
    console.log("🔄 Cargando aeropuertos...");
    axios
      .get("http://localhost:8000/airports")
      .then((res) => {
        const valid = res.data.filter((a) => {
          const lat = parseFloat(a.lat);
          const lng = parseFloat(a.lng);
          return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        });
        console.log("🗺️ Aeropuertos válidos:", valid.length);
        setAirports(valid);
      })
      .catch((err) => console.error("❌ Error al obtener aeropuertos:", err));
  }, []);

  const handleMarkerClick = async (iata) => {
    try {
      const { data } = await axios.get(`http://localhost:8000/airports/${iata}`);
      setPopupData((prev) => ({ ...prev, [iata]: data }));
    } catch (err) {
      console.error("❌ Error al obtener datos del aeropuerto:", err);
    }
  };

  const bounds = airports.map((a) => [parseFloat(a.lat), parseFloat(a.lng)]);

  return (
    <MapContainer
      bounds={bounds.length > 0 ? bounds : undefined}
      center={[0, 0]}
      zoom={2}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup>
        {airports.map((airport, idx) => {
          const key = airport.iata_faa || airport.icao;
          const lat = parseFloat(airport.lat);
          const lng = parseFloat(airport.lng);
          if (!key || isNaN(lat) || isNaN(lng)) return null;

          const data = popupData[key] || airport;

          return (
            <Marker
              key={idx}
              position={[lat, lng]}
              eventHandlers={{
                click: () => handleMarkerClick(key),
              }}
            >
              <Popup>
                <div style={{ minWidth: "200px", lineHeight: "1.5" }}>
                  <strong>{data.name}</strong><br />
                  <span style={{ fontSize: "0.9em", color: "#555" }}>
                    {data.city}<br />
                    IATA: <strong>{data.iata_faa}</strong><br />
                    ICAO: <strong>{data.icao}</strong><br />
                    Altitud: {data.alt} ft<br />
                    Zona Horaria: {data.tz}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
