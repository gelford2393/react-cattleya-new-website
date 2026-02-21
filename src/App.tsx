import { Navigate, Route, Routes } from "react-router-dom";
import { Dashboard } from "./components/admin/Dashboard";
import { PoolDetailsPage, PoolsRates } from "./components/admin/Pools";
import { AdminLayout } from "./layouts/Admin";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pools-rates" element={<PoolsRates />} />
        <Route path="pools/:poolId" element={<PoolDetailsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
