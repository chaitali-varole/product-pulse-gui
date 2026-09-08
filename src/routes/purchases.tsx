import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AdminLayout } from "@/components/erp/AdminLayout";
import {
  Button,
  Card,
  Field,
  Modal,
  PageHeader,
  SearchInput,
  StatCard,
  Table,
  Td,
  Toolbar,
} from "@/components/erp/ui";
import {
  COLLECTIONS,
  formatDate,
  formatMoney,
  nextBusinessId,
  type Product,
  type Purchase,
  type Supplier,
} from "@/lib/collections";
import { recordMovement, useCollection } from "@/hooks/useFirestore";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "Purchase Management — StockCore ERP" },
      {
        name: "description",
        content:
          "Record purchases from suppliers; stock quantities and movement history update automatically.",
      },
      { property: "og:title", content: "Purchase Management — StockCore ERP" },
      {
        property: "og:description",
        content: "Record supplier purchases and keep stock in step automatically.",
      },
    ],
  }),
  component: PurchasesPage,
});

const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({
  supplierId: "",
  productId: "",
  quantity: "",
  purchasePrice: "",
  purchaseDate: today(),
});

function PurchasesPage() {
  const purchases = useCollection<Purchase>(COLLECTIONS.purchases);
  const products = useCollection<Product>(COLLECTIONS.products);
  const suppliers = useCollection<Supplier>(COLLECTIONS.suppliers);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productOf = (id: string) => products.data.find((p) => p.productId === id || p.id === id);
  const supplierOf = (id: string) => suppliers.data.find((s) => s.supplierId === id || s.id === id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return purchases.data;
    return purchases.data.filter(
      (p) =>
        p.purchaseId?.toLowerCase().includes(q) ||
        supplierOf(p.supplierId)?.supplierName?.toLowerCase().includes(q) ||
        productOf(p.productId)?.productName?.toLowerCase().includes(q),
    );
  }, [purchases.data, search, products.data, suppliers.data]);

  const monthTotal = purchases.data
    .filter((p) => (p.purchaseDate ?? "").slice(0, 7) === today().slice(0, 7))
    .reduce((sum, p) => sum + Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0), 0);
  const allTimeTotal = purchases.data.reduce(
    (sum, p) => sum + Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0),
    0,
  );

  const onProductChange = (value: string) => {
    const p = productOf(value);
    setForm((f) => ({
      ...f,
      productId: value,
      purchasePrice: p?.purchasePrice ? String(p.purchasePrice) : f.purchasePrice,
      supplierId: f.supplierId || (p?.supplierId ?? ""),
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = productOf(form.productId);
    if (!product) {
      setError("Choose a product first.");
      return;
    }
    setBusy(true);
    setError(null);
    const purchaseId = nextBusinessId("PUR", purchases.data.length);
    try {
      await recordMovement({
        kind: "purchase",
        header: {
          purchaseId,
          supplierId: form.supplierId,
          productId: product.productId ?? product.id,
          quantity: Number(form.quantity || 0),
          purchasePrice: Number(form.purchasePrice || 0),
          purchaseDate: form.purchaseDate,
        },
        productDocId: product.id,
        productId: product.productId ?? product.id,
        quantity: Number(form.quantity || 0),
        referenceId: purchaseId,
        date: form.purchaseDate,
      });
      setForm(empty());
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't record this purchase.");
    } finally {
      setBusy(false);
    }
  };

  const canRecord = products.data.length > 0;

  return (
    <AdminLayout>
      <PageHeader
        title="Purchase Management"
        description="Record goods bought from suppliers. Each entry adds stock and logs a movement automatically."
        actions={
          <Button onClick={() => setOpen(true)} disabled={!canRecord}>
            <Plus className="size-4" /> Record purchase
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Purchase entries" value={purchases.data.length} loading={purchases.loading} />
        <StatCard
          label="Units purchased"
          value={purchases.data.reduce((s, p) => s + Number(p.quantity ?? 0), 0)}
          loading={purchases.loading}
        />
        <StatCard
          label="This month's value"
          value={purchases.data.length ? formatMoney(monthTotal) : undefined}
          loading={purchases.loading}
        />
        <StatCard
          label="Total purchase value"
          value={purchases.data.length ? formatMoney(allTimeTotal) : undefined}
          loading={purchases.loading}
        />
      </div>

      {!canRecord && !products.loading ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Add at least one product before recording a purchase.
        </p>
      ) : null}

      <Card title="Purchase records">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search reference, supplier or product"
          />
        </Toolbar>
        <Table
          columns={["Reference", "Supplier", "Product", "Quantity", "Unit price", "Total", "Date"]}
          rows={filtered.length}
          loading={purchases.loading}
          error={purchases.error}
          emptyTitle={purchases.data.length ? "No purchases match your search" : "No purchases yet"}
          emptyBody={
            purchases.data.length
              ? "Try a different reference, supplier or product."
              : "Record a purchase and stock levels will update straight away."
          }
        >
          {filtered.map((p) => (
            <tr key={p.id} className="hover:bg-muted/40">
              <Td className="font-mono text-xs text-muted-foreground">{p.purchaseId}</Td>
              <Td>{supplierOf(p.supplierId)?.supplierName ?? "—"}</Td>
              <Td className="font-medium">{productOf(p.productId)?.productName ?? p.productId}</Td>
              <Td>{p.quantity}</Td>
              <Td>{formatMoney(p.purchasePrice)}</Td>
              <Td className="font-semibold">
                {formatMoney(Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0))}
              </Td>
              <Td className="text-muted-foreground">{formatDate(p.purchaseDate)}</Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record purchase"
        description="Adds stock and writes a movement entry"
      >
        <form className="space-y-4" onSubmit={save}>
          <Field
            label="Product"
            as="select"
            options={products.data.map((p) => ({
              value: p.productId ?? p.id,
              label: `${p.productName} (${p.quantity ?? 0} in stock)`,
            }))}
            value={form.productId}
            onChange={onProductChange}
            required
          />
          <Field
            label="Supplier"
            as="select"
            options={suppliers.data.map((s) => ({
              value: s.supplierId ?? s.id,
              label: s.supplierName,
            }))}
            value={form.supplierId}
            onChange={(v) => setForm({ ...form, supplierId: v })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Quantity"
              type="number"
              min="1"
              placeholder="0"
              value={form.quantity}
              onChange={(v) => setForm({ ...form, quantity: v })}
              required
            />
            <Field
              label="Unit price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.purchasePrice}
              onChange={(v) => setForm({ ...form, purchasePrice: v })}
              required
            />
            <Field
              label="Purchase date"
              type="date"
              value={form.purchaseDate}
              onChange={(v) => setForm({ ...form, purchaseDate: v })}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Record purchase"}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
