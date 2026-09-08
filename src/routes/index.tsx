import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Boxes, LineChart, Lock, Mail, ShieldCheck, Warehouse } from "lucide-react";
import { Button, Field } from "@/components/erp/ui";

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

function LoginPage() {
  const navigate = useNavigate();

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
              { icon: Warehouse, text: "Live stock positions across every location" },
              { icon: LineChart, text: "Purchase and sales insight in one place" },
              { icon: ShieldCheck, text: "Role-based admin controls" },
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

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/dashboard" });
            }}
          >
            <div className="relative">
              <Field label="Email address" type="email" placeholder="admin@company.com" />
              <Mail className="pointer-events-none absolute bottom-3 right-3 size-4 text-muted-foreground" />
            </div>
            <div className="relative">
              <Field label="Password" type="password" placeholder="••••••••" />
              <Lock className="pointer-events-none absolute bottom-3 right-3 size-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="size-4 rounded border-input accent-primary" />
                Remember me
              </label>
              <button type="button" className="font-medium text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full">
              Sign in to dashboard
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Authentication is not wired up yet — signing in opens the{" "}
            <Link to="/dashboard" className="font-medium text-primary hover:underline">
              admin dashboard
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
