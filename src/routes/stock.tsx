import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/erp/AdminLayout";
import {
  Badge,
  Card,
  PageHeader,
  SearchInput,
  StatCard,
  Table,
  Td,
  Toolbar,
} from "@/components/erp/ui";
import {
  COLLECTIONS,
  formatMoney,
  type Product,
  type StockTransaction,
  type Supplier,
} from "@/lib/collections";
import { useCollection } from "@/hooks/useFirestore";

export const Route = createFileRoute("/stock")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : "all",
  }),
  head: () => ({
    meta: [
      { title: "Current Stock — StockCore ERP" },
      {
        name: "description",
        content:
          "Live stock on hand for every product, with valuation, low-stock flags and total movement in and out.",
      },
      { property: "og:title", content: "Current Stock — StockCore ERP" },
      { property: "og:description", content: "Live stock on hand and valuation per product." },
    ],
  }),
  component: StockPage,
});

const LOW_STOCK = 10;
const FILTERS = [
  { key: "all", label: "All" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Out of stock" },
] as const;

function StockPage() {
  const products = useCollection<Product>(COLLECTIONS.products);
  const transactions = useCollection<StockTransaction>(COLLECTIONS.stockTransactions);
  const suppliers = useCollection<Supplier>(COLLECTIONS.suppliers);
  const { status } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [search, setSearch] = useState("");

  const active = FILTERS.some((f) => f.key === status) ? status : "all";
  const setActive = (key: string) => {
    void navigate({ search: { status: key } });
  };

  const movement = (productId: string, type: "IN" | "OUT") =>
    transactions.data
      .filter((t) => t.productId === productId && t.type === type)
      .reduce((sum, t) => sum + Number(t.quantity ?? 0), 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.data.filter((p) => {
      const qty = Number(p.quantity ?? 0);
      const matchesStatus =
        active === "low" ? qty > 0 && qty <= LOW_STOCK : active === "out" ? qty <= 0 : true;
      return (
        matchesStatus &&
        (!q ||
          p.productName?.toLowerCase().includes(q) ||
          p.productId?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q))
      );
    });
  }, [products.data, search, active]);


  const totalUnits = products.data.reduce((s, p) => s + Number(p.quantity ?? 0), 0);
  const valuation = products.data.reduce(
    (s, p) => s + Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0),
    0,
  );
  const lowCount = products.data.filter(
    (p) => Number(p.quantity ?? 0) > 0 && Number(p.quantity ?? 0) <= LOW_STOCK,
  ).length;
  const outCount = products.data.filter((p) => Number(p.quantity ?? 0) <= 0).length;

  return (
    <AdminLayout>
      <PageHeader
        title="Current Stock Management"
        description="What you hold right now, straight from your live records — no manual updating needed."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total units in stock" value={totalUnits} loading={products.loading} />
        <StatCard
          label="Stock valuation"
          value={products.data.length ? formatMoney(valuation) : undefined}
          hint="At purchase price"
          loading={products.loading}
        />
        <StatCard label="Low stock items" value={lowCount} hint={`${LOW_STOCK} units or fewer`} loading={products.loading} />
        <StatCard label="Out of stock items" value={outCount} loading={products.loading} />
      </div>

      <Card title="Stock on hand" description="Every product with its current balance">
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search product or code" />
          <div className="flex h-10 items-center gap-1 rounded-md border border-border p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setActive(f.key)}
                className={
                  active === f.key
                    ? "cursor-pointer rounded px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground"
                    : "cursor-pointer rounded px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                }
              >
                {f.label}
              </button>
            ))}
          </div>

        </Toolbar>
        <Table
          columns={[
            "Code",
            "Product",
            "Category",
            "Supplier",
            "Stock in",
            "Stock out",
            "On hand",
            "Valuation",
            "Status",
          ]}
          rows={filtered.length}
          loading={products.loading}
          error={products.error}
          emptyTitle={products.data.length ? "Nothing matches your filters" : "No stock records yet"}
          emptyBody={
            products.data.length
              ? "Try clearing the search or the low-stock filter."
              : "Add products and record purchases to build up your stock position."
          }
        >
          {filtered.map((p) => {
            const key = p.productId ?? p.id;
            const qty = Number(p.quantity ?? 0);
            return (
              <tr key={p.id} className="hover:bg-muted/40">
                <Td className="font-mono text-xs text-muted-foreground">{p.productId ?? "—"}</Td>
                <Td className="font-medium">{p.productName}</Td>
                <Td className="text-muted-foreground">{p.category || "—"}</Td>
                <Td className="text-muted-foreground">
                  {suppliers.data.find(
                    (s) => s.supplierId === p.supplierId || s.id === p.supplierId,
                  )?.supplierName ?? "—"}
                </Td>
                <Td className="text-success">+{movement(key, "IN")}</Td>
                <Td className="text-destructive">−{movement(key, "OUT")}</Td>
                <Td className="font-semibold">{qty}</Td>
                <Td>{formatMoney(qty * Number(p.purchasePrice ?? 0))}</Td>
                <Td>
                  {qty <= 0 ? (
                    <Badge tone="danger">Out of stock</Badge>
                  ) : qty <= LOW_STOCK ? (
                    <Badge tone="warning">Low</Badge>
                  ) : (
                    <Badge tone="success">In stock</Badge>
                  )}
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </AdminLayout>
  );
}
