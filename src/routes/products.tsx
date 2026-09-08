import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/erp/AdminLayout";
import {
  Badge,
  Button,
  Card,
  Field,
  Modal,
  PageHeader,
  SearchInput,
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
  type Supplier,
} from "@/lib/collections";
import {
  createDocument,
  deleteDocument,
  updateDocument,
  useCollection,
} from "@/hooks/useFirestore";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Product Management — StockCore ERP" },
      {
        name: "description",
        content:
          "Add, edit and remove products with categories, quantities, purchase and selling prices and supplier links.",
      },
      { property: "og:title", content: "Product Management — StockCore ERP" },
      {
        property: "og:description",
        content: "Live product catalogue with add, edit and delete.",
      },
    ],
  }),
  component: ProductsPage,
});

const CATEGORIES = ["Raw material", "Finished goods", "Consumable", "Spare part", "Packaging"];

const empty = {
  productName: "",
  category: "",
  quantity: "",
  purchasePrice: "",
  sellingPrice: "",
  supplierId: "",
};

function ProductsPage() {
  const products = useCollection<Product>(COLLECTIONS.products);
  const suppliers = useCollection<Supplier>(COLLECTIONS.suppliers);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supplierName = (id: string) =>
    suppliers.data.find((s) => s.supplierId === id || s.id === id)?.supplierName ?? "—";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.data.filter(
      (p) =>
        (!category || p.category === category) &&
        (!q ||
          p.productName?.toLowerCase().includes(q) ||
          p.productId?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)),
    );
  }, [products.data, search, category]);

  const openAdd = () => {
    setEditing(null);
    setForm(empty);
    setError(null);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      productName: p.productName ?? "",
      category: p.category ?? "",
      quantity: String(p.quantity ?? ""),
      purchasePrice: String(p.purchasePrice ?? ""),
      sellingPrice: String(p.sellingPrice ?? ""),
      supplierId: p.supplierId ?? "",
    });
    setError(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      productName: form.productName.trim(),
      category: form.category,
      quantity: Number(form.quantity || 0),
      purchasePrice: Number(form.purchasePrice || 0),
      sellingPrice: Number(form.sellingPrice || 0),
      supplierId: form.supplierId,
    };
    try {
      if (editing) {
        await updateDocument(COLLECTIONS.products, editing.id, payload);
      } else {
        await createDocument(COLLECTIONS.products, {
          ...payload,
          productId: nextBusinessId("PRD", products.data.length),
        });
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this product.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deleteDocument(COLLECTIONS.products, confirm.id);
      setConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this product.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Product Management"
        description="Your live product catalogue — quantities update automatically as purchases and sales are recorded."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add product
          </Button>
        }
      />

      <Card
        title="All products"
        description={`${products.data.length} product${products.data.length === 1 ? "" : "s"} in the catalogue`}
      >
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or code" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Toolbar>
        <Table
          columns={[
            "Code",
            "Product",
            "Category",
            "Supplier",
            "Quantity",
            "Purchase price",
            "Selling price",
            "Added",
            "",
          ]}
          rows={filtered.length}
          loading={products.loading}
          error={products.error}
          emptyTitle={products.data.length ? "No products match your filters" : "No products yet"}
          emptyBody={
            products.data.length
              ? "Try clearing the search or category filter."
              : "Add your first product and it will appear here instantly."
          }
        >
          {filtered.map((p) => (
            <tr key={p.id} className="hover:bg-muted/40">
              <Td className="font-mono text-xs text-muted-foreground">{p.productId ?? "—"}</Td>
              <Td className="font-medium">{p.productName}</Td>
              <Td>{p.category ? <Badge>{p.category}</Badge> : "—"}</Td>
              <Td className="text-muted-foreground">{supplierName(p.supplierId)}</Td>
              <Td>
                {Number(p.quantity ?? 0) <= 0 ? (
                  <Badge tone="danger">Out of stock</Badge>
                ) : Number(p.quantity) <= 10 ? (
                  <Badge tone="warning">{p.quantity} low</Badge>
                ) : (
                  <span className="font-semibold">{p.quantity}</span>
                )}
              </Td>
              <Td>{formatMoney(p.purchasePrice)}</Td>
              <Td>{formatMoney(p.sellingPrice)}</Td>
              <Td className="text-muted-foreground">{formatDate(p.createdAt)}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    aria-label={`Edit ${p.productName}`}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setConfirm(p)}
                    aria-label={`Delete ${p.productName}`}
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
        title={editing ? "Edit product" : "Add product"}
        description={editing ? editing.productId : "Saved straight to your live catalogue"}
      >
        <form id="product-form" className="space-y-4" onSubmit={save}>
          <Field
            label="Product name"
            placeholder="e.g. Steel bracket 12mm"
            value={form.productName}
            onChange={(v) => setForm({ ...form, productName: v })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Category"
              as="select"
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
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
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Quantity"
              type="number"
              min="0"
              placeholder="0"
              value={form.quantity}
              onChange={(v) => setForm({ ...form, quantity: v })}
              required
            />
            <Field
              label="Purchase price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.purchasePrice}
              onChange={(v) => setForm({ ...form, purchasePrice: v })}
              required
            />
            <Field
              label="Selling price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.sellingPrice}
              onChange={(v) => setForm({ ...form, sellingPrice: v })}
              required
            />
          </div>
          {suppliers.data.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Add suppliers first to link them to products.
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Add product"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete product?"
        description={confirm?.productName}
      >
        <p className="text-sm text-muted-foreground">
          This permanently removes the product from your catalogue. Past purchase, sale and stock
          movement records are kept.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
          <Button variant="danger" onClick={remove} disabled={busy}>
            {busy ? "Deleting…" : "Delete product"}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
