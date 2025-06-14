import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import axios from "axios";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster/dist/MarkerCluster.css";


// Fix para íconos de Leaflet en React
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
    console.log("Cargando aeropuertos...");
    axios
      .get("http://localhost:8000/airports")
      .then((res) => {
        console.log("Aeropuertos cargados:", res.data);
        setAirports(res.data);
      })
      .catch((err) => console.error("Error al obtener aeropuertos:", err));
  }, []);

  const handleMarkerClick = async (iata) => {
    try {
      const res = await axios.get(`http://localhost:8000/airports/${iata}`);
      setPopupData((prev) => ({ ...prev, [iata]: res.data }));
    } catch (err) {
      console.error("Error al obtener datos del aeropuerto:", err);
    }
  };

  const bounds = airports
    .filter((a) => a.lat && a.lng)
    .map((a) => [a.lat, a.lng]);

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
          const { lat, lng } = airport;
          if (!lat || !lng || !key) return null;

          return (
            <Marker
              key={idx}
              position={[lat, lng]}
              eventHandlers={{
                click: () => handleMarkerClick(key),
              }}
            >
              <Popup>
                {popupData[key] ? (
                  <div style={{ minWidth: "200px", lineHeight: "1.5" }}>
                    <strong>{popupData[key].name}</strong><br />
                    <span style={{ fontSize: "0.9em", color: "#555" }}>
                      {popupData[key].city}<br />
                      IATA: <strong>{popupData[key].iata_faa}</strong><br />
                      ICAO: <strong>{popupData[key].icao}</strong><br />
                      Altitud: {popupData[key].alt} ft<br />
                      Zona Horaria: {popupData[key].tz}
                    </span>
                  </div>
                ) : (
                  "Cargando..."
                )}
              </Popup>
            </Marker>
          );
        })}
</MarkerClusterGroup>
    </MapContainer>
  );
}
