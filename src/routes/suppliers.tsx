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

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "Supplier Management — StockCore ERP" },
      {
        name: "description",
        content:
          "Add, edit and remove suppliers with contact numbers, email addresses and delivery addresses.",
      },
      { property: "og:title", content: "Supplier Management — StockCore ERP" },
      { property: "og:description", content: "Live supplier directory with full editing." },
    ],
  }),
  component: SuppliersPage,
});

const empty = { supplierName: "", mobile: "", email: "", address: "" };

function SuppliersPage() {
  const suppliers = useCollection<Supplier>(COLLECTIONS.suppliers);
  const products = useCollection<Product>(COLLECTIONS.products);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Supplier | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers.data;
    return suppliers.data.filter((s) =>
      [s.supplierName, s.supplierId, s.mobile, s.email].some((v) =>
        v?.toLowerCase().includes(q),
      ),
    );
  }, [suppliers.data, search]);

  const productCount = (s: Supplier) =>
    products.data.filter((p) => p.supplierId === s.supplierId || p.supplierId === s.id).length;

  const openAdd = () => {
    setEditing(null);
    setForm(empty);
    setError(null);
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      supplierName: s.supplierName ?? "",
      mobile: s.mobile ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
    });
    setError(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      supplierName: form.supplierName.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };
    try {
      if (editing) await updateDocument(COLLECTIONS.suppliers, editing.id, payload);
      else
        await createDocument(COLLECTIONS.suppliers, {
          ...payload,
          supplierId: nextBusinessId("SUP", suppliers.data.length),
        });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this supplier.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deleteDocument(COLLECTIONS.suppliers, confirm.id);
      setConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this supplier.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Supplier Management"
        description="Everyone you buy from, with contact details and the products they supply."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add supplier
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total suppliers"
          value={suppliers.data.length}
          loading={suppliers.loading}
        />
        <StatCard
          label="Suppliers with products"
          value={suppliers.data.filter((s) => productCount(s) > 0).length}
          loading={suppliers.loading || products.loading}
        />
        <StatCard
          label="Products supplied"
          value={products.data.filter((p) => p.supplierId).length}
          loading={products.loading}
        />
      </div>

      <Card title="Supplier directory">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, phone or email"
          />
        </Toolbar>
        <Table
          columns={["Code", "Supplier", "Mobile", "Email", "Address", "Products", "Added", ""]}
          rows={filtered.length}
          loading={suppliers.loading}
          error={suppliers.error}
          emptyTitle={suppliers.data.length ? "No suppliers match your search" : "No suppliers yet"}
          emptyBody={
            suppliers.data.length
              ? "Try a different name, phone number or email."
              : "Add your first supplier and it will appear here instantly."
          }
        >
          {filtered.map((s) => (
            <tr key={s.id} className="hover:bg-muted/40">
              <Td className="font-mono text-xs text-muted-foreground">{s.supplierId ?? "—"}</Td>
              <Td className="font-medium">{s.supplierName}</Td>
              <Td>{s.mobile || "—"}</Td>
              <Td className="text-muted-foreground">{s.email || "—"}</Td>
              <Td className="max-w-[16rem] truncate whitespace-normal text-muted-foreground">
                {s.address || "—"}
              </Td>
              <Td>{productCount(s)}</Td>
              <Td className="text-muted-foreground">{formatDate(s.createdAt)}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    aria-label={`Edit ${s.supplierName}`}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setConfirm(s)}
                    aria-label={`Delete ${s.supplierName}`}
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
        title={editing ? "Edit supplier" : "Add supplier"}
        description={editing ? editing.supplierId : "Saved straight to your live directory"}
      >
        <form className="space-y-4" onSubmit={save}>
          <Field
            label="Supplier name"
            placeholder="Company name"
            value={form.supplierName}
            onChange={(v) => setForm({ ...form, supplierName: v })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Mobile"
              type="tel"
              placeholder="+00 00000 00000"
              value={form.mobile}
              onChange={(v) => setForm({ ...form, mobile: v })}
              required
            />
            <Field
              label="Email"
              type="email"
              placeholder="contact@supplier.com"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
          </div>
          <Field
            label="Address"
            as="textarea"
            placeholder="Street, city, postal code"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Add supplier"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete supplier?"
        description={confirm?.supplierName}
      >
        <p className="text-sm text-muted-foreground">
          This removes the supplier from your directory. Products and purchases that referenced them
          are kept.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
          <Button variant="danger" onClick={remove} disabled={busy}>
            {busy ? "Deleting…" : "Delete supplier"}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
