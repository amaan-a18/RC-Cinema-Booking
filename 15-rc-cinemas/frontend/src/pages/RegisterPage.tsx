import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useRegister } from "@/api/hooks";
import { extractErrorMessage } from "@/api/client";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const register = useRegister();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({ email, full_name: fullName, password });
      navigate("/");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Sign up</h1>
        <p className="mt-1 text-sm text-ink-soft">Create an account to book your seats.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Full name
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-sm border border-ink/20 bg-bg px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
            />
          </div>
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
              minLength={6}
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
          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending ? "Creating account…" : "Sign up"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
