import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Navbar } from "@/components/layout/Navbar";

/** The customer-facing shell. Admin accounts never browse the public site --
 * they're bounced straight to the admin console. */
export function PublicLayout() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
