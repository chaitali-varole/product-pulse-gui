import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  deleteMovement,
  recordMovement,
  updateMovement,
  useCollection,
} from "@/hooks/useFirestore";

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
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [confirm, setConfirm] = useState<Purchase | null>(null);
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

  const openAdd = () => {
    setEditing(null);
    setForm(empty());
    setError(null);
    setOpen(true);
  };

  const openEdit = (p: Purchase) => {
    setEditing(p);
    setForm({
      supplierId: p.supplierId ?? "",
      productId: p.productId ?? "",
      quantity: String(p.quantity ?? ""),
      purchasePrice: String(p.purchasePrice ?? ""),
      purchaseDate: p.purchaseDate ?? today(),
    });
    setError(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = productOf(form.productId);
    if (!product) {
      setError("Choose a product first.");
      return;
    }
    const qty = Number(form.quantity || 0);
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        const oldProduct = productOf(editing.productId);
        await updateMovement({
          kind: "purchase",
          docId: editing.id,
          referenceId: editing.purchaseId,
          header: {
            supplierId: form.supplierId,
            productId: product.productId ?? product.id,
            quantity: qty,
            purchasePrice: Number(form.purchasePrice || 0),
            purchaseDate: form.purchaseDate,
          },
          oldProductDocId: oldProduct?.id ?? product.id,
          oldQuantity: Number(editing.quantity ?? 0),
          productDocId: product.id,
          productId: product.productId ?? product.id,
          quantity: qty,
          date: form.purchaseDate,
        });
      } else {
        const purchaseId = nextBusinessId("PUR", purchases.data.length);
        await recordMovement({
          kind: "purchase",
          header: {
            purchaseId,
            supplierId: form.supplierId,
            productId: product.productId ?? product.id,
            quantity: qty,
            purchasePrice: Number(form.purchasePrice || 0),
            purchaseDate: form.purchaseDate,
          },
          productDocId: product.id,
          productId: product.productId ?? product.id,
          quantity: qty,
          referenceId: purchaseId,
          date: form.purchaseDate,
        });
      }
      setForm(empty());
      setEditing(null);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this purchase.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    const product = productOf(confirm.productId);
    setBusy(true);
    try {
      await deleteMovement({
        kind: "purchase",
        docId: confirm.id,
        referenceId: confirm.purchaseId,
        productDocId: product?.id ?? "",
        quantity: Number(confirm.quantity ?? 0),
      });
      setConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this purchase.");
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
          <Button onClick={openAdd} disabled={!canRecord}>
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
          columns={["Reference", "Supplier", "Product", "Quantity", "Unit price", "Total", "Date", ""]}
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
              <Td>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    aria-label={`Edit ${p.purchaseId}`}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setConfirm(p)}
                    aria-label={`Delete ${p.purchaseId}`}
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit purchase" : "Record purchase"}
        description={
          editing ? `${editing.purchaseId} — stock adjusts automatically` : "Adds stock and writes a movement entry"
        }
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
              {busy ? "Saving…" : editing ? "Save changes" : "Record purchase"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete purchase?"
        description={confirm?.purchaseId}
      >
        <p className="text-sm text-muted-foreground">
          This removes the purchase, takes the {confirm?.quantity ?? 0} unit
          {Number(confirm?.quantity ?? 0) === 1 ? "" : "s"} back out of stock and deletes its
          movement entry.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
          <Button variant="danger" onClick={remove} disabled={busy}>
            {busy ? "Deleting…" : "Delete purchase"}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
