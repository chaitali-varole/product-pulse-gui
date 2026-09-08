import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/erp/AdminLayout";
import { Button, Card, DataTable, Field, PageHeader, StatCard, Toolbar } from "@/components/erp/ui";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Current Stock — StockCore ERP" },
      {
        name: "description",
        content:
          "See live stock on hand per product and warehouse, with reorder levels and stock adjustments.",
      },
      { property: "og:title", content: "Current Stock — StockCore ERP" },
      {
        property: "og:description",
        content: "Live stock on hand per product and warehouse with adjustments.",
      },
    ],
  }),
  component: StockPage,
});

function StockPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Current Stock Management"
        description="Live stock on hand by product and location, with manual adjustments."
        actions={
          <>
            <Button variant="outline">Export</Button>
            <Button>Stock adjustment</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total stock units" />
        <StatCard label="Stock valuation" />
        <StatCard label="Low stock items" />
        <StatCard label="Out of stock items" />
      </div>

      <Card title="Stock on hand">
        <Toolbar placeholder="Search product or SKU">
          <Button variant="outline">Warehouse</Button>
          <Button variant="outline">Category</Button>
          <Button variant="outline">Low stock only</Button>
        </Toolbar>
        <DataTable
          columns={[
            "SKU",
            "Product",
            "Category",
            "Warehouse",
            "On hand",
            "Reserved",
            "Available",
            "Reorder level",
            "Valuation",
          ]}
        />
      </Card>

      <Card title="Manual stock adjustment" description="Correct counts after audits or damage">
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Product" as="select" options={["Select product"]} />
          <Field label="Warehouse" as="select" options={["Main warehouse", "Store front"]} />
          <Field label="Adjustment type" as="select" options={["Increase", "Decrease", "Recount"]} />
          <Field label="Quantity" type="number" placeholder="0" />
          <div className="sm:col-span-2 xl:col-span-4">
            <Field label="Reason" as="textarea" placeholder="Audit correction, damage, expiry…" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline">Clear</Button>
          <Button>Apply adjustment</Button>
        </div>
      </Card>
    </AdminLayout>
  );
}
