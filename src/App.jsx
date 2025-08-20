import React from "react";
import { Routes, Route } from "react-router-dom";

import CheckIn from "./pages/CheckIn";
import ServiceSelection from "./pages/ServiceSelection";
import ModalGroomer from "./pages/ModalGroomer";
import Dashboard from "./pages/Dashboard";
import AttendancesPage from "./pages/AttendancesPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<CheckIn />} />
      <Route path="/consulta" element={<AttendancesPage />} />
      <Route path="/services" element={<ServiceSelection />} />
      <Route path="/groomer" element={<ModalGroomer />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
