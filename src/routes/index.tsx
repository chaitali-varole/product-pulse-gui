import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Boxes, LineChart, Loader2, ShieldCheck, Warehouse } from "lucide-react";
import { Button, Field } from "@/components/erp/ui";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — StockCore ERP Stock Management" },
      {
        name: "description",
        content:
          "Sign in to StockCore ERP to manage products, suppliers, customers, purchases, sales and live stock levels.",
      },
      { property: "og:title", content: "Sign in — StockCore ERP" },
      {
        property: "og:description",
        content: "Secure admin access to your ERP stock management workspace.",
      },
    ],
  }),
  component: LoginPage,
});

function friendlyError(code: string): string {
  if (code.includes("invalid-credential") || code.includes("wrong-password"))
    return "That email and password don't match. Please try again.";
  if (code.includes("user-not-found")) return "No account exists with that email address.";
  if (code.includes("invalid-email")) return "That doesn't look like a valid email address.";
  if (code.includes("too-many-requests"))
    return "Too many attempts. Please wait a moment and try again.";
  if (code.includes("network")) return "Couldn't reach the server. Check your connection.";
  return "Sign in failed. Please try again.";
}

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user, loading, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!configured) {
      navigate({ to: "/dashboard" });
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(friendlyError(code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Boxes className="size-5" />
          </span>
          <p className="font-display text-lg font-semibold">StockCore ERP</p>
        </div>

        <div className="max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Every unit accounted for, from purchase order to dispatch.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-muted">
            One workspace for products, suppliers, customers, purchases, sales and live stock
            movement — built for teams that count in real time.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: Warehouse, text: "Live stock positions, updated the moment they change" },
              { icon: LineChart, text: "Purchase and sales insight in one place" },
              { icon: ShieldCheck, text: "Secure sign-in for your team" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sidebar-muted">
                <Icon className="size-4 text-accent" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-sidebar-muted">© {new Date().getFullYear()} StockCore ERP</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </span>
            <p className="font-display text-lg font-semibold">StockCore ERP</p>
          </div>

          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use your administrator credentials to continue.
          </p>

          {loading ? (
            <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Checking your session…
            </div>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <Field
                label="Email address"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={setEmail}
                required
              />
              <Field
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                required
              />

              {error ? (
                <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="size-4 rounded border-input accent-primary" />
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {busy ? "Signing in…" : "Sign in to dashboard"}
              </Button>
            </form>
          )}

          {!configured && !loading ? (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Your database isn't connected yet, so sign-in is skipped for now.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
