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

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "Purchase Management — StockCore ERP" },
      {
        name: "description",
        content:
          "Raise purchase orders, record goods received and track supplier invoices and payment status.",
      },
      { property: "og:title", content: "Purchase Management — StockCore ERP" },
      {
        property: "og:description",
        content: "Purchase orders, goods received notes and supplier invoice tracking.",
      },
    ],
  }),
  component: PurchasesPage,
});

function PurchasesPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Purchase Management"
        description="Raise purchase orders, record goods received and track supplier invoices."
        actions={
          <>
            <Button variant="outline">Goods received note</Button>
            <Button>New purchase order</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open purchase orders" />
        <StatCard label="Received this month" />
        <StatCard label="Purchase value" />
        <StatCard label="Pending payments" />
      </div>

      <Card title="New purchase order" description="Header details">
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="PO number" placeholder="PO-0001" />
          <Field label="Supplier" as="select" options={["Select from supplier directory"]} />
          <Field label="Order date" type="date" />
          <Field label="Expected delivery" type="date" />
        </div>
        <div className="border-t border-border px-5 py-5">
          <p className="mb-3 text-sm font-semibold">Line items</p>
          <Placeholder
            title="No line items added"
            body="Products, quantities, rates, tax and totals will be entered here once the catalogue is connected."
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline">Save as draft</Button>
          <Button>Submit order</Button>
        </div>
      </Card>

      <Card title="Purchase orders">
        <Toolbar placeholder="Search by PO number or supplier">
          <Button variant="outline">Status</Button>
          <Button variant="outline">Date range</Button>
        </Toolbar>
        <DataTable
          columns={[
            "PO No.",
            "Supplier",
            "Order date",
            "Expected",
            "Items",
            "Total",
            "Payment",
            "Status",
            "Actions",
          ]}
        />
      </Card>
    </AdminLayout>
  );
}
