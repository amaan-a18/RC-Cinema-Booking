import { Link, NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/common/Button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "px-3 py-1.5 text-sm font-semibold tracking-wide transition-colors rounded-sm",
    isActive ? "bg-gold text-bg" : "text-ink/70 hover:text-ink hover:bg-ink/5",
  );

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-gold text-sm font-bold text-bg">
            RC
          </span>
          <span className="font-display text-lg font-bold leading-none text-ink">
            RC Cinemas
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Now Showing
          </NavLink>
          {user && (
            <NavLink to="/my-bookings" className={navLinkClass}>
              My Bookings
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-ink">{user.full_name}</p>
                <p className="text-[11px] uppercase leading-tight text-ink-soft">{user.role}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
