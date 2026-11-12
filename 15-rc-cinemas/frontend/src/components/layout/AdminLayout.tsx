import { NavLink, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/common/Button";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/movies", label: "Movies", end: false },
  { to: "/admin/screens", label: "Screens & Seating", end: false },
  { to: "/admin/shows", label: "Shows", end: false },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "block rounded-sm px-3 py-2 text-sm font-semibold tracking-wide transition-colors",
    isActive ? "bg-gold text-bg" : "text-ink/70 hover:bg-ink/5 hover:text-ink",
  );

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-60 shrink-0 flex-col border-r border-ink/10 bg-surface">
        <div className="flex items-center gap-2 border-b border-ink/10 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-gold text-sm font-bold text-bg">
            RC
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-ink">RC Cinemas</p>
            <p className="text-[10px] uppercase tracking-wide text-gold">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink/10 px-5 py-4">
          <p className="text-sm font-semibold leading-tight text-ink">{user?.full_name}</p>
          <p className="text-[11px] uppercase leading-tight text-ink-soft">{user?.role}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
