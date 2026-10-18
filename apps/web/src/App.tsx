import { Route, Routes, useLocation } from "react-router-dom";
import AuthCallback from "@/components/AuthCallback";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Talents from "@/pages/Talents";
import TalentDetail from "@/pages/TalentDetail";
import Activities from "@/pages/Activities";
import MapPage from "@/pages/MapPage";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import MyProfiles from "@/pages/MyProfiles";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import NotFound from "@/pages/NotFound";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  const location = useLocation();
  // Google sign-in returns with #session_id=... — exchange it before any route renders.
  if (location.hash.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/talentos" element={<Talents />} />
        <Route path="/talento/:id" element={<TalentDetail />} />
        <Route path="/atividades" element={<Activities />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/cadastrar" element={<Register />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/perfil" element={<MyProfiles />} />
        <Route path="/meus-perfis" element={<MyProfiles />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
