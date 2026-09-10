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
  type Customer,
  type Product,
  type Sale,
} from "@/lib/collections";
import {
  deleteMovement,
  recordMovement,
  updateMovement,
  useCollection,
} from "@/hooks/useFirestore";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales Management — StockCore ERP" },
      {
        name: "description",
        content:
          "Record customer sales; stock quantities and movement history update automatically in real time.",
      },
      { property: "og:title", content: "Sales Management — StockCore ERP" },
      {
        property: "og:description",
        content: "Record customer sales and keep stock in step automatically.",
      },
    ],
  }),
  component: SalesPage,
});

const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({
  customerId: "",
  productId: "",
  quantity: "",
  sellingPrice: "",
  saleDate: today(),
});

function SalesPage() {
  const sales = useCollection<Sale>(COLLECTIONS.sales);
  const products = useCollection<Product>(COLLECTIONS.products);
  const customers = useCollection<Customer>(COLLECTIONS.customers);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [confirm, setConfirm] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productOf = (id: string) => products.data.find((p) => p.productId === id || p.id === id);
  const customerOf = (id: string) => customers.data.find((c) => c.customerId === id || c.id === id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales.data;
    return sales.data.filter(
      (s) =>
        s.saleId?.toLowerCase().includes(q) ||
        customerOf(s.customerId)?.customerName?.toLowerCase().includes(q) ||
        productOf(s.productId)?.productName?.toLowerCase().includes(q),
    );
  }, [sales.data, search, products.data, customers.data]);

  const monthTotal = sales.data
    .filter((s) => (s.saleDate ?? "").slice(0, 7) === today().slice(0, 7))
    .reduce((sum, s) => sum + Number(s.quantity ?? 0) * Number(s.sellingPrice ?? 0), 0);
  const allTimeTotal = sales.data.reduce(
    (sum, s) => sum + Number(s.quantity ?? 0) * Number(s.sellingPrice ?? 0),
    0,
  );

  const selected = productOf(form.productId);
  const available = Number(selected?.quantity ?? 0);

  const onProductChange = (value: string) => {
    const p = productOf(value);
    setForm((f) => ({
      ...f,
      productId: value,
      sellingPrice: p?.sellingPrice ? String(p.sellingPrice) : f.sellingPrice,
    }));
  };

  const openAdd = () => {
    setEditing(null);
    setForm(empty());
    setError(null);
    setOpen(true);
  };

  const openEdit = (sale: Sale) => {
    setEditing(sale);
    setForm({
      customerId: sale.customerId ?? "",
      productId: sale.productId ?? "",
      quantity: String(sale.quantity ?? ""),
      sellingPrice: String(sale.sellingPrice ?? ""),
      saleDate: sale.saleDate ?? today(),
    });
    setError(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setError("Choose a product first.");
      return;
    }
    const qty = Number(form.quantity || 0);
    const sameProduct = editing ? (productOf(editing.productId)?.id ?? null) === selected.id : false;
    const allowance = available + (sameProduct ? Number(editing?.quantity ?? 0) : 0);
    if (qty > allowance) {
      setError(`Only ${allowance} in stock. Reduce the quantity or record a purchase first.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        const oldProduct = productOf(editing.productId);
        await updateMovement({
          kind: "sale",
          docId: editing.id,
          referenceId: editing.saleId,
          header: {
            customerId: form.customerId,
            productId: selected.productId ?? selected.id,
            quantity: qty,
            sellingPrice: Number(form.sellingPrice || 0),
            saleDate: form.saleDate,
          },
          oldProductDocId: oldProduct?.id ?? selected.id,
          oldQuantity: Number(editing.quantity ?? 0),
          productDocId: selected.id,
          productId: selected.productId ?? selected.id,
          quantity: qty,
          date: form.saleDate,
        });
      } else {
        const saleId = nextBusinessId("SAL", sales.data.length);
        await recordMovement({
          kind: "sale",
          header: {
            saleId,
            customerId: form.customerId,
            productId: selected.productId ?? selected.id,
            quantity: qty,
            sellingPrice: Number(form.sellingPrice || 0),
            saleDate: form.saleDate,
          },
          productDocId: selected.id,
          productId: selected.productId ?? selected.id,
          quantity: qty,
          referenceId: saleId,
          date: form.saleDate,
        });
      }
      setForm(empty());
      setEditing(null);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this sale.");
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
        kind: "sale",
        docId: confirm.id,
        referenceId: confirm.saleId,
        productDocId: product?.id ?? "",
        quantity: Number(confirm.quantity ?? 0),
      });
      setConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this sale.");
    } finally {
      setBusy(false);
    }
  };

  const canRecord = products.data.length > 0 && customers.data.length > 0;

  return (
    <AdminLayout>
      <PageHeader
        title="Sales Management"
        description="Record goods sold to customers. Each entry reduces stock and logs a movement automatically."
        actions={
          <Button onClick={openAdd} disabled={!canRecord}>
            <Plus className="size-4" /> Record sale
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales entries" value={sales.data.length} loading={sales.loading} />
        <StatCard
          label="Units sold"
          value={sales.data.reduce((s, x) => s + Number(x.quantity ?? 0), 0)}
          loading={sales.loading}
        />
        <StatCard
          label="This month's value"
          value={sales.data.length ? formatMoney(monthTotal) : undefined}
          loading={sales.loading}
        />
        <StatCard
          label="Total sales value"
          value={sales.data.length ? formatMoney(allTimeTotal) : undefined}
          loading={sales.loading}
        />
      </div>

      {!canRecord && !products.loading && !customers.loading ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Add at least one product and one customer before recording a sale.
        </p>
      ) : null}

      <Card title="Sales records">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search reference, customer or product"
          />
        </Toolbar>
        <Table
          columns={["Reference", "Customer", "Product", "Quantity", "Unit price", "Total", "Date", ""]}
          rows={filtered.length}
          loading={sales.loading}
          error={sales.error}
          emptyTitle={sales.data.length ? "No sales match your search" : "No sales yet"}
          emptyBody={
            sales.data.length
              ? "Try a different reference, customer or product."
              : "Record a sale and stock levels will update straight away."
          }
        >
          {filtered.map((s) => (
            <tr key={s.id} className="hover:bg-muted/40">
              <Td className="font-mono text-xs text-muted-foreground">{s.saleId}</Td>
              <Td>{customerOf(s.customerId)?.customerName ?? "—"}</Td>
              <Td className="font-medium">{productOf(s.productId)?.productName ?? s.productId}</Td>
              <Td>{s.quantity}</Td>
              <Td>{formatMoney(s.sellingPrice)}</Td>
              <Td className="font-semibold">
                {formatMoney(Number(s.quantity ?? 0) * Number(s.sellingPrice ?? 0))}
              </Td>
              <Td className="text-muted-foreground">{formatDate(s.saleDate)}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    aria-label={`Edit ${s.saleId}`}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setConfirm(s)}
                    aria-label={`Delete ${s.saleId}`}
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
        title={editing ? "Edit sale" : "Record sale"}
        description={
          editing ? `${editing.saleId} — stock adjusts automatically` : "Reduces stock and writes a movement entry"
        }
      >
        <form className="space-y-4" onSubmit={save}>
          <Field
            label="Product"
            as="select"
            options={products.data.map((p) => ({
              value: p.productId ?? p.id,
              label: `${p.productName} (${p.quantity ?? 0} available)`,
            }))}
            value={form.productId}
            onChange={onProductChange}
            required
          />
          <Field
            label="Customer"
            as="select"
            options={customers.data.map((c) => ({
              value: c.customerId ?? c.id,
              label: c.customerName,
            }))}
            value={form.customerId}
            onChange={(v) => setForm({ ...form, customerId: v })}
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
              value={form.sellingPrice}
              onChange={(v) => setForm({ ...form, sellingPrice: v })}
              required
            />
            <Field
              label="Sale date"
              type="date"
              value={form.saleDate}
              onChange={(v) => setForm({ ...form, saleDate: v })}
              required
            />
          </div>
          {selected ? (
            <p className="text-xs text-muted-foreground">
              {available} unit{available === 1 ? "" : "s"} available for {selected.productName}.
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Record sale"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete sale?"
        description={confirm?.saleId}
      >
        <p className="text-sm text-muted-foreground">
          This removes the sale, returns the {confirm?.quantity ?? 0} unit
          {Number(confirm?.quantity ?? 0) === 1 ? "" : "s"} to stock and deletes its movement entry.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
          <Button variant="danger" onClick={remove} disabled={busy}>
            {busy ? "Deleting…" : "Delete sale"}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
