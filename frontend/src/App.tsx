import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/ui/Layout";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import TrafficPage from "./pages/TrafficPage";
import TransitPage from "./pages/TransitPage";
import EnvironmentPage from "./pages/EnvironmentPage";
import CommutePage from "./pages/CommutePage";
import SimulationPage from "./pages/SimulationPage";
import HistoryPage from "./pages/HistoryPage";

import BikesPage from "./pages/BikesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/traffic" element={<TrafficPage />} />
          <Route path="/transit" element={<TransitPage />} />
          <Route path="/environment" element={<EnvironmentPage />} />
          <Route path="/bikes" element={<BikesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/commute" element={<CommutePage />} />
          <Route path="/simulation" element={<SimulationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
