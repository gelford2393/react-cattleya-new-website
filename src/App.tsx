import { Navigate, Route, Routes } from "react-router-dom";
import { Dashboard } from "./components/admin/Dashboard";
import { AdminLayout } from "./layouts/Admin";
import { PoolsLayout, PoolsPage } from "./pages/admin/Pools";
import { PoolsEditLayout, PoolsEditPage } from "./pages/admin/Pools/edit";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pools-rates" element={<PoolsLayout />}>
          <Route index element={<PoolsPage />} />
        </Route>
        <Route path="pools/:poolId/edit" element={<PoolsEditLayout />}>
          <Route index element={<PoolsEditPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
