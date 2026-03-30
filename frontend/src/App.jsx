import { useState, useEffect } from "react";
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
import Proposals from "./pages/Proposals";

function AppRoutes({ logged, setLogged }) {
  useEffect(() => {
    const listener = () => setLogged(!!localStorage.getItem("token"));
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [setLogged]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          logged ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLogin={() => setLogged(true)} />
          )
        }
      />
      {logged ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/proprietarios" element={<Owners />} />
          <Route path="/imoveis" element={<Properties />} />
          <Route path="/documentos" element={<Documents />} />
          <Route path="/agendamentos" element={<Appointments />} />
          <Route path="/propostas" element={<Proposals />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem("token"));
  return <AppRoutes logged={logged} setLogged={setLogged} />;
}