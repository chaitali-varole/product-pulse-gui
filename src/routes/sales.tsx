import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/erp/AdminLayout";
import {
  Button,
  Card,
  DataTable,
  Field,
  PageHeader,
  Placeholder,
  StatCard,
  Toolbar,
} from "@/components/erp/ui";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales Management — StockCore ERP" },
      {
        name: "description",
        content:
          "Create sales orders and invoices, track dispatch status and monitor customer payments.",
      },
      { property: "og:title", content: "Sales Management — StockCore ERP" },
      {
        property: "og:description",
        content: "Sales orders, invoices, dispatch status and customer payments.",
      },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Sales Management"
        description="Create sales orders and invoices, track dispatch and monitor payments."
        actions={
          <>
            <Button variant="outline">Sales return</Button>
            <Button>New sales invoice</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open sales orders" />
        <StatCard label="Invoices this month" />
        <StatCard label="Sales value" />
        <StatCard label="Payments due" />
      </div>

      <Card title="New sales invoice" description="Header details">
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Invoice number" placeholder="INV-0001" />
          <Field label="Customer" as="select" options={["Select from customer directory"]} />
          <Field label="Invoice date" type="date" />
          <Field label="Payment mode" as="select" options={["Cash", "Bank transfer", "Credit", "UPI"]} />
        </div>
        <div className="border-t border-border px-5 py-5">
          <p className="mb-3 text-sm font-semibold">Line items</p>
          <Placeholder
            title="No line items added"
            body="Product selection, available stock, quantity, rate, discount and tax will appear here."
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline">Save as draft</Button>
          <Button>Generate invoice</Button>
        </div>
      </Card>

      <Card title="Sales invoices">
        <Toolbar placeholder="Search by invoice or customer">
          <Button variant="outline">Status</Button>
          <Button variant="outline">Date range</Button>
        </Toolbar>
        <DataTable
          columns={[
            "Invoice",
            "Customer",
            "Date",
            "Items",
            "Total",
            "Payment",
            "Dispatch",
            "Status",
            "Actions",
          ]}
        />
      </Card>
    </AdminLayout>
  );
}
