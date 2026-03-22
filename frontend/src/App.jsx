import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import "./App.css";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Owners from "./pages/Owners";
import Properties from "./pages/Properties";
import Documents from "./pages/Documents";

function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem("token"));

  if (!logged) {
    return <Login onLogin={() => setLogged(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/proprietarios" element={<Owners />} />
          <Route path="/imoveis" element={<Properties />} />
          <Route path="/documentos" element={<Documents />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;