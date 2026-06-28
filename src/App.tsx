import { BrowserRouter, NavLink, Route, Routes, Navigate } from "react-router-dom";
import StudentsPage from "./pages/StudentsPage";
import EvaluationPage from "./pages/EvaluationPage";
import BilanPage from "./pages/BilanPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <main className="container">
        <h1>LSUcreator</h1>

        <nav className="nav-bar" aria-label="Navigation principale">
          <NavLink to="/students" className={({ isActive }) => (isActive ? "active" : undefined)}>Élèves</NavLink>
          <NavLink to="/evaluations" className={({ isActive }) => (isActive ? "active" : undefined)}>Évaluations</NavLink>
          <NavLink to="/bilan" className={({ isActive }) => (isActive ? "active" : undefined)}>Bilan LSU</NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : undefined)}>Réglages</NavLink>
        </nav>

        <Routes>
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/evaluations" element={<EvaluationPage />} />
          <Route path="/bilan" element={<BilanPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/evaluations" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
