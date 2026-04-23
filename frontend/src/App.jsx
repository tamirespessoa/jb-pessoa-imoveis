import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import "./App.css";

// SISTEMA
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
import Users from "./pages/Users";
import Leads from "./pages/Leads";
import Perfil from "./pages/Perfil";
import Chat from "./pages/Chat";
import DadosEmpresa from "./pages/DadosEmpresa";
import Financiamentos from "./pages/Financiamentos";

// SITE PÚBLICO
import SiteHome from "./pages/SiteHome";
import SiteProperties from "./pages/SiteProperties";
import SitePropertyDetails from "./pages/SitePropertyDetails";
import SiteRegisterProperty from "./pages/SiteRegisterProperty";

function ProtectedRoute({ logged, children }) {
  if (!logged) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes({ logged, setLogged }) {
  useEffect(() => {
    const listener = () => {
      setLogged(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", listener);

    return () => {
      window.removeEventListener("storage", listener);
    };
  }, [setLogged]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/site" replace />} />
      <Route path="/site" element={<SiteHome />} />
      <Route path="/site/imoveis" element={<SiteProperties />} />
      <Route path="/site/imoveis/:id" element={<SitePropertyDetails />} />
      <Route
        path="/site/cadastrar-imovel"
        element={<SiteRegisterProperty />}
      />

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

      <Route
        element={
          <ProtectedRoute logged={logged}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/proprietarios" element={<Owners />} />
        <Route path="/imoveis" element={<Properties />} />
        <Route path="/documentos" element={<Documents />} />
        <Route path="/agendamentos" element={<Appointments />} />
        <Route path="/propostas" element={<Proposals />} />
        <Route path="/solicitacoes" element={<Requests />} />
        <Route path="/usuarios" element={<Users />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/dados-empresa" element={<DadosEmpresa />} />
        <Route path="/financiamentos" element={<Financiamentos />} />
      </Route>

      <Route path="*" element={<Navigate to="/site" replace />} />
    </Routes>
  );
}

export default function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem("token"));

  return <AppRoutes logged={logged} setLogged={setLogged} />;
}