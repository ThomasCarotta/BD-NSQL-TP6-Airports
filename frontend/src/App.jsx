import React from "react";
import AirportMap from "./components/AirportMap";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <AirportMap />
      </div>
    </div>
  );
}

export default App;
