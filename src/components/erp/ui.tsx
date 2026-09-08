import { useEffect, type ReactNode } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
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
  variant?: "primary" | "outline" | "ghost" | "accent" | "danger";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    accent: "bg-accent text-accent-foreground hover:opacity-90",
    outline: "border border-border bg-card text-foreground hover:bg-muted",
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
  } as const;
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
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
  children?: ReactNode | undefined;
  className?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  actions?: ReactNode | undefined;
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
  value,
  hint,
  icon,
  loading,
}: {
  label: string;
  value?: string | number | undefined;
  hint?: string | undefined;
  icon?: ReactNode | undefined;
  loading?: boolean | undefined;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
        {loading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : value !== undefined && value !== "" ? (
          value
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
    />
  );
}

export function Toolbar({ children }: { children?: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 px-5 py-4">{children}</div>;
}

export function Table({
  columns,
  rows,
  loading,
  error,
  emptyTitle = "No records yet",
  emptyBody = "Records added here appear instantly, for you and everyone else on the account.",
  children,
}: {
  columns: string[];
  rows: number;
  loading?: boolean | undefined;
  error?: string | null | undefined;
  emptyTitle?: string | undefined;
  emptyBody?: string | undefined;
  children?: ReactNode | undefined;
}) {
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
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-16 text-center">
                <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                <p className="mt-3 text-xs text-muted-foreground">Loading live data…</p>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-16 text-center">
                <AlertTriangle className="mx-auto size-5 text-destructive" />
                <p className="mt-3 text-sm font-medium">Couldn't load these records</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{error}</p>
              </td>
            </tr>
          ) : rows === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-16 text-center">
                <p className="text-sm font-medium">{emptyTitle}</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{emptyBody}</p>
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("whitespace-nowrap px-5 py-3.5", className)}>{children}</td>;
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "success" | "warning" | "danger" | "primary";
}) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/18 text-warning-foreground",
    danger: "bg-destructive/12 text-destructive",
    primary: "bg-primary/10 text-primary",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  as = "input",
  options,
  value,
  onChange,
  required,
  min,
  step,
}: {
  label: string;
  type?: string;
  placeholder?: string | undefined;
  as?: "input" | "select" | "textarea";
  options?: { value: string; label: string }[] | undefined;
  value: string;
  onChange: (v: string) => void;
  required?: boolean | undefined;
  min?: string | undefined;
  step?: string | undefined;
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {as === "select" ? (
        <select
          className={cn(base, "h-10")}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {(options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea
          rows={3}
          placeholder={placeholder}
          className={base}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className={cn(base, "h-10")}
          value={value}
          required={required}
          min={min}
          step={step}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-foreground/50 p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0"
        role="presentation"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl border border-border bg-card shadow-card sm:rounded-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
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

export function ConfigNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-5 py-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-foreground" />
      <div className="text-sm">
        <p className="font-semibold">Not connected to your database yet</p>
        <p className="mt-1 text-muted-foreground">
          Add your Firebase project details and this workspace will start reading and writing live
          records immediately. Nothing is stored locally and no sample data is shown.
        </p>
      </div>
    </div>
  );
}
