import { Navigate, Route, Routes } from "react-router-dom";
import { Dashboard } from "./components/admin/Dashboard";
import { RequireAdminAuth } from "./components/admin/Auth/RequireAdminAuth";
import { AdminLayout } from "./layouts/Admin";
import { PoolsLayout, PoolsPage } from "./pages/admin/Pools";
import { PoolsEditLayout, PoolsEditPage } from "./pages/admin/Pools/edit";
import ReservationEditorPage from "./pages/admin/Reservation/page";
import ReservationLayout from "./pages/admin/Reservation/layout";
import LocationMapLayout from "./pages/admin/LocationMap/layout";
import LocationMapPage from "./pages/admin/LocationMap/page";
import ContactUsLayout from "./pages/admin/ContactUs/layout";
import ContactUsPage from "./pages/admin/ContactUs/page";
import NoteLayout from "./pages/admin/Note/layout";
import NotePage from "./pages/admin/Note/page";
import AdminSettingsPage from "./pages/admin/Settings/page";
import AdminLoginPage from "./pages/admin/Login/page";
import HomePage from "./pages/public/HomePage";
import PoolDetailsPage from "./pages/public/PoolDetailsPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pools/:poolId" element={<PoolDetailsPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<RequireAdminAuth />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pools-rates" element={<PoolsLayout />}>
              <Route index element={<PoolsPage />} />
            </Route>
            <Route path="reservation-editor" element={<ReservationLayout />}>
              <Route index element={<ReservationEditorPage />} />
            </Route>
            <Route path="location-map" element={<LocationMapLayout />}>
              <Route index element={<LocationMapPage />} />
            </Route>
            <Route path="contact-us" element={<ContactUsLayout />}>
              <Route index element={<ContactUsPage />} />
            </Route>
            <Route path="note" element={<NoteLayout />}>
              <Route index element={<NotePage />} />
            </Route>
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="pools/:poolId/edit" element={<PoolsEditLayout />}>
              <Route index element={<PoolsEditPage />} />
            </Route>
          </Route>
        </Route>

      </Routes>
      <Toaster />
    </>
  );
}

export default App;
