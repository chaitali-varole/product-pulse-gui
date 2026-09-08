import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/erp/AdminLayout";
import { Button, Card, DataTable, Field, PageHeader, StatCard, Toolbar } from "@/components/erp/ui";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "Supplier Management — StockCore ERP" },
      {
        name: "description",
        content:
          "Keep supplier contacts, payment terms and purchase history organised in one supplier directory.",
      },
      { property: "og:title", content: "Supplier Management — StockCore ERP" },
      {
        property: "og:description",
        content: "Supplier directory with contacts, terms and purchase history.",
      },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Supplier Management"
        description="Your supplier directory — contacts, payment terms and purchase history."
        actions={<Button>Add supplier</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total suppliers" />
        <StatCard label="Active this month" />
        <StatCard label="Outstanding payables" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card title="Supplier directory">
          <Toolbar placeholder="Search suppliers">
            <Button variant="outline">Status</Button>
          </Toolbar>
          <DataTable
            columns={[
              "Code",
              "Supplier name",
              "Contact person",
              "Phone",
              "Email",
              "City",
              "Payment terms",
              "Actions",
            ]}
          />
        </Card>

        <Card title="Add supplier">
          <form className="space-y-4 p-5">
            <Field label="Supplier name" placeholder="Company name" />
            <Field label="Contact person" placeholder="Full name" />
            <Field label="Phone" type="tel" placeholder="+00 00000 00000" />
            <Field label="Email" type="email" placeholder="contact@supplier.com" />
            <Field label="GST / Tax ID" placeholder="Tax identifier" />
            <Field label="Address" as="textarea" placeholder="Street, city, postal code" />
            <Field
              label="Payment terms"
              as="select"
              options={["Advance", "Net 15", "Net 30", "Net 60"]}
            />
            <Button type="button" className="w-full">
              Save supplier
            </Button>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
