import React, { useState } from "react";
import Header from "./components/Header";
import AirportMap from "./components/AirportMap";
import Sidebar from "./components/Sidebar";

function App() {
  const [reload, setReload] = useState(false);

  const handleRefresh = () => setReload((r) => !r);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header onRefresh={handleRefresh} />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <div style={{ flex: 1 }}>
          <AirportMap reload={reload} />
        </div>
      </div>
    </div>
  );
}

export default App;
