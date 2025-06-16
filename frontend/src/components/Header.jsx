// Header.jsx

import React, { useState } from "react";
import axios from "axios";

export default function Header({ onRefresh }) {
  const [iata, setIata] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    iata_faa: "",
    icao: "",
    lat: "",
    lng: "",
    alt: "",
    tz: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const createAirport = async () => {
    try {
      await axios.post("http://localhost:8000/airports", formData);
      alert("Aeropuerto creado con éxito");
      onRefresh();
    } catch (err) {
      alert("Error al crear aeropuerto");
      console.error(err);
    }
  };

  const getAirport = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/airports/${iata}`);
      setFormData(res.data);
    } catch (err) {
      alert("Aeropuerto no encontrado");
      console.error(err);
    }
  };

  const updateAirport = async () => {
    try {
      await axios.put(
        `http://localhost:8000/airports/${iata}`,
        formData
      );
      alert("Aeropuerto actualizado");
      onRefresh();
    } catch (err) {
      alert("Error al actualizar aeropuerto");
      console.error(err);
    }
  };

  const deleteAirport = async () => {
    try {
      await axios.delete(
        `http://localhost:8000/airports/${iata}`
      );
      alert("Aeropuerto eliminado");
      // Limpiar formulario para evitar que queden datos obsoletos
      setFormData({
        name: "",
        city: "",
        iata_faa: "",
        icao: "",
        lat: "",
        lng: "",
        alt: "",
        tz: "",
      });
      setIata("");
      onRefresh();
    } catch (err) {
      alert("Error al eliminar aeropuerto");
      console.error(err);
    }
  };

  return (
    <header className="header">
      <h2>Gestión de Aeropuertos</h2>

      <div className="crud-form">
        <input
          className="input"
          placeholder="IATA o ICAO"
          value={iata}
          onChange={(e) => setIata(e.target.value)}
        />
        <button className="btn" onClick={getAirport}>Buscar</button>
        <button className="btn" onClick={deleteAirport}>Eliminar</button>
      </div>

      <div className="crud-form">
        {Object.entries(formData).map(([key, value]) => (
          <input
            key={key}
            name={key}
            className="input"
            placeholder={key}
            value={value}
            onChange={handleChange}
          />
        ))}
        <button className="btn" onClick={createAirport}>Crear</button>
        <button className="btn" onClick={updateAirport}>Modificar</button>
      </div>
    </header>
  );
}
