import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import "./App.css";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Owners from "./pages/Owners";
import Properties from "./pages/Properties";
import Documents from "./pages/Documents";
import Appointments from "./pages/Appointments";

function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem("token"));

  return (
    <Routes>
      <Route
        path="/login"
        element={
          logged ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login onLogin={() => setLogged(true)} />
          )
        }
      />

      {logged ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/proprietarios" element={<Owners />} />
          <Route path="/imoveis" element={<Properties />} />
          <Route path="/documentos" element={<Documents />} />
          <Route path="/agendamentos" element={<Appointments />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
}

export default App;