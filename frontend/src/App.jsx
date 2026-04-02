import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import "./App.css";

// ======================
// 🔐 SISTEMA (INTERNO)
// ======================
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Owners from "./pages/Owners";
import Properties from "./pages/Properties";
import Documents from "./pages/Documents";
import Appointments from "./pages/Appointments";
import Proposals from "./pages/Proposals";
import Requests from "./pages/Requests";

// ======================
// 🌐 SITE PÚBLICO
// ======================
import SiteHome from "./pages/SiteHome";
import SiteProperties from "./pages/SiteProperties";
import SitePropertyDetails from "./pages/SitePropertyDetails";
import SiteRegisterProperty from "./pages/SiteRegisterProperty";

function AppRoutes({ logged, setLogged }) {
  useEffect(() => {
    const listener = () => {
      setLogged(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [setLogged]);

  return (
    <Routes>
      {/* ====================== */}
      {/* 🌐 SITE PÚBLICO */}
      {/* ====================== */}
      <Route path="/" element={<Navigate to="/site" replace />} />
      <Route path="/site" element={<SiteHome />} />
      <Route path="/site/imoveis" element={<SiteProperties />} />
      <Route path="/site/imoveis/:id" element={<SitePropertyDetails />} />
      <Route
        path="/site/cadastrar-imovel"
        element={<SiteRegisterProperty />}
      />

      {/* ====================== */}
      {/* 🔐 LOGIN */}
      {/* ====================== */}
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

      {/* ====================== */}
      {/* 🏢 SISTEMA */}
      {/* ====================== */}
      {logged ? (
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/proprietarios" element={<Owners />} />
          <Route path="/imoveis" element={<Properties />} />
          <Route path="/documentos" element={<Documents />} />
          <Route path="/agendamentos" element={<Appointments />} />
          <Route path="/propostas" element={<Proposals />} />
          <Route path="/solicitacoes" element={<Requests />} />
        </Route>
      ) : (
        <>
          <Route path="/dashboard" element={<Navigate to="/login" replace />} />
          <Route path="/clientes" element={<Navigate to="/login" replace />} />
          <Route
            path="/proprietarios"
            element={<Navigate to="/login" replace />}
          />
          <Route path="/imoveis" element={<Navigate to="/login" replace />} />
          <Route
            path="/documentos"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/agendamentos"
            element={<Navigate to="/login" replace />}
          />
          <Route path="/propostas" element={<Navigate to="/login" replace />} />
          <Route
            path="/solicitacoes"
            element={<Navigate to="/login" replace />}
          />
        </>
      )}

      {/* ====================== */}
      {/* 🔁 FALLBACK */}
      {/* ====================== */}
      <Route path="*" element={<Navigate to="/site" replace />} />
    </Routes>
  );
}

export default function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem("token"));

  return <AppRoutes logged={logged} setLogged={setLogged} />;
}