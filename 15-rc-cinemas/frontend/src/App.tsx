import { Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { HomePage } from "@/pages/HomePage";
import { MovieDetailPage } from "@/pages/MovieDetailPage";
import { SeatSelectionPage } from "@/pages/SeatSelectionPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { MyBookingsPage } from "@/pages/MyBookingsPage";
import { AdminOverviewPage } from "@/pages/admin/AdminOverviewPage";
import { AdminMoviesPage } from "@/pages/admin/AdminMoviesPage";
import { AdminScreensPage } from "@/pages/admin/AdminScreensPage";
import { AdminShowsPage } from "@/pages/admin/AdminShowsPage";

function App() {
  return (
    <Routes>
      {/* Admin console -- a separate shell (sidebar dashboard), never the
          customer-facing site. */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="movies" element={<AdminMoviesPage />} />
        <Route path="screens" element={<AdminScreensPage />} />
        <Route path="shows" element={<AdminShowsPage />} />
      </Route>

      {/* Customer-facing site -- admin accounts are redirected out of here
          by PublicLayout. */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="movies/:movieId" element={<MovieDetailPage />} />
        <Route
          path="shows/:showId/seats"
          element={
            <ProtectedRoute roles={["user"]}>
              <SeatSelectionPage />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="my-bookings"
          element={
            <ProtectedRoute roles={["user"]}>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
