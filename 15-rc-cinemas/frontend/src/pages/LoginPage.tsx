import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "@/api/hooks";
import { extractErrorMessage } from "@/api/client";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await login.mutateAsync({ email, password });
      navigate(data.user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Log in</h1>
        <p className="mt-1 text-sm text-ink-soft">Book tickets and manage your bookings.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-ink/20 bg-bg px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-ink/20 bg-bg px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
            />
          </div>
          {error && (
            <div className="rounded-sm border border-red-900 bg-red-950 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Seeded accounts</p>
        <p className="text-xs text-ink-soft">
          <button
            type="button"
            onClick={() => {
              setEmail("admin@rccinemas.com");
              setPassword("password123");
            }}
            className="text-gold hover:underline"
          >
            admin@rccinemas.com
          </button>{" "}
          / password123 &middot; admin console
        </p>
        <p className="text-xs text-ink-soft">
          <button
            type="button"
            onClick={() => {
              setEmail("demo@rccinemas.com");
              setPassword("password123");
            }}
            className="text-gold hover:underline"
          >
            demo@rccinemas.com
          </button>{" "}
          / password123 &middot; regular patron
        </p>
      </Card>
    </div>
  );
}
