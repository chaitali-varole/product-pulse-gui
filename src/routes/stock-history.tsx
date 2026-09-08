import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/erp/AdminLayout";
import { Button, Card, DataTable, Field, PageHeader, StatCard } from "@/components/erp/ui";

export const Route = createFileRoute("/stock-history")({
  head: () => ({
    meta: [
      { title: "Stock In / Out History — StockCore ERP" },
      {
        name: "description",
        content:
          "Audit every stock movement: inward receipts, outward dispatches, transfers and adjustments.",
      },
      { property: "og:title", content: "Stock In / Out History — StockCore ERP" },
      {
        property: "og:description",
        content: "Audit trail of inward, outward, transfer and adjustment movements.",
      },
    ],
  }),
  component: StockHistoryPage,
});

function StockHistoryPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Stock In / Stock Out History"
        description="A complete audit trail of every inward, outward, transfer and adjustment movement."
        actions={<Button variant="outline">Export history</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Stock in (period)" />
        <StatCard label="Stock out (period)" />
        <StatCard label="Net movement" />
      </div>

      <Card title="Filter movements">
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <Field label="From date" type="date" />
          <Field label="To date" type="date" />
          <Field
            label="Movement type"
            as="select"
            options={["Stock in", "Stock out", "Transfer", "Adjustment"]}
          />
          <Field label="Product" as="select" options={["All products"]} />
          <Field label="Warehouse" as="select" options={["All warehouses"]} />
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline">Reset</Button>
          <Button>Apply filters</Button>
        </div>
      </Card>

      <Card title="Movement log">
        <DataTable
          columns={[
            "Date & time",
            "Reference",
            "Type",
            "Product",
            "Warehouse",
            "Quantity",
            "Balance after",
            "Party",
            "Recorded by",
          ]}
        />
      </Card>
    </AdminLayout>
  );
}
