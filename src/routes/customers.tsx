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
  type Sale,
} from "@/lib/collections";
import {
  createDocument,
  deleteDocument,
  updateDocument,
  useCollection,
} from "@/hooks/useFirestore";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customer Management — StockCore ERP" },
      {
        name: "description",
        content:
          "Add, edit and remove customers with contact numbers, email addresses and delivery addresses.",
      },
      { property: "og:title", content: "Customer Management — StockCore ERP" },
      { property: "og:description", content: "Live customer directory with full editing." },
    ],
  }),
  component: CustomersPage,
});

const empty = { customerName: "", mobile: "", email: "", address: "" };

function CustomersPage() {
  const customers = useCollection<Customer>(COLLECTIONS.customers);
  const sales = useCollection<Sale>(COLLECTIONS.sales);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Customer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers.data;
    return customers.data.filter((c) =>
      [c.customerName, c.customerId, c.mobile, c.email].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [customers.data, search]);

  const salesFor = (c: Customer) =>
    sales.data.filter((s) => s.customerId === c.customerId || s.customerId === c.id);

  const openAdd = () => {
    setEditing(null);
    setForm(empty);
    setError(null);
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      customerName: c.customerName ?? "",
      mobile: c.mobile ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
    });
    setError(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      customerName: form.customerName.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };
    try {
      if (editing) await updateDocument(COLLECTIONS.customers, editing.id, payload);
      else
        await createDocument(COLLECTIONS.customers, {
          ...payload,
          customerId: nextBusinessId("CUS", customers.data.length),
        });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this customer.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deleteDocument(COLLECTIONS.customers, confirm.id);
      setConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this customer.");
    } finally {
      setBusy(false);
    }
  };

  const totalSalesValue = sales.data.reduce(
    (sum, s) => sum + Number(s.quantity ?? 0) * Number(s.sellingPrice ?? 0),
    0,
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Customer Management"
        description="Everyone you sell to, with contact details and their order activity."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add customer
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total customers"
          value={customers.data.length}
          loading={customers.loading}
        />
        <StatCard
          label="Customers with orders"
          value={customers.data.filter((c) => salesFor(c).length > 0).length}
          loading={customers.loading || sales.loading}
        />
        <StatCard
          label="Total sales value"
          value={sales.data.length ? formatMoney(totalSalesValue) : undefined}
          loading={sales.loading}
        />
      </div>

      <Card title="Customer directory">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, phone or email"
          />
        </Toolbar>
        <Table
          columns={["Code", "Customer", "Mobile", "Email", "Address", "Orders", "Added", ""]}
          rows={filtered.length}
          loading={customers.loading}
          error={customers.error}
          emptyTitle={customers.data.length ? "No customers match your search" : "No customers yet"}
          emptyBody={
            customers.data.length
              ? "Try a different name, phone number or email."
              : "Add your first customer and it will appear here instantly."
          }
        >
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-muted/40">
              <Td className="font-mono text-xs text-muted-foreground">{c.customerId ?? "—"}</Td>
              <Td className="font-medium">{c.customerName}</Td>
              <Td>{c.mobile || "—"}</Td>
              <Td className="text-muted-foreground">{c.email || "—"}</Td>
              <Td className="max-w-[16rem] truncate whitespace-normal text-muted-foreground">
                {c.address || "—"}
              </Td>
              <Td>{salesFor(c).length}</Td>
              <Td className="text-muted-foreground">{formatDate(c.createdAt)}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    aria-label={`Edit ${c.customerName}`}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setConfirm(c)}
                    aria-label={`Delete ${c.customerName}`}
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
        title={editing ? "Edit customer" : "Add customer"}
        description={editing ? editing.customerId : "Saved straight to your live directory"}
      >
        <form className="space-y-4" onSubmit={save}>
          <Field
            label="Customer name"
            placeholder="Company or person"
            value={form.customerName}
            onChange={(v) => setForm({ ...form, customerName: v })}
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
              placeholder="buyer@customer.com"
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
              {busy ? "Saving…" : editing ? "Save changes" : "Add customer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete customer?"
        description={confirm?.customerName}
      >
        <p className="text-sm text-muted-foreground">
          This removes the customer from your directory. Their past sales records are kept.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
          <Button variant="danger" onClick={remove} disabled={busy}>
            {busy ? "Deleting…" : "Delete customer"}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
