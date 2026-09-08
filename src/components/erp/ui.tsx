import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold sm:text-[1.75rem]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "accent";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    accent: "bg-accent text-accent-foreground hover:opacity-90",
    outline: "border border-border bg-card text-foreground hover:bg-muted",
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  } as const;
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
  title,
  description,
  actions,
}: {
  children?: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-card",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            {title ? <h3 className="text-base font-semibold">{title}</h3> : null}
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  hint,
  icon,
}: {
  label: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-muted-foreground/50">
        —
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint ?? "Awaiting data source"}</p>
    </div>
  );
}

export function Toolbar({ placeholder, children }: { placeholder: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-4">
      <input
        type="search"
        placeholder={placeholder}
        className="h-10 w-full min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
      />
      {children}
    </div>
  );
}

export function DataTable({ columns }: { columns: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-y border-border bg-muted/60 text-left">
            {columns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="px-5 py-16 text-center">
              <p className="text-sm font-medium">No records yet</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                This table will fill in once the data source is connected.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  as = "input",
  options,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  as?: "input" | "select" | "textarea";
  options?: string[];
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {as === "select" ? (
        <select className={cn(base, "h-10")} defaultValue="">
          <option value="" disabled>
            Select {label.toLowerCase()}
          </option>
          {(options ?? []).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea rows={3} placeholder={placeholder} className={base} />
      ) : (
        <input type={type} placeholder={placeholder} className={cn(base, "h-10")} />
      )}
    </label>
  );
}

export function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
