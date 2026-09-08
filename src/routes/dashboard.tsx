import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/components/erp/AdminLayout";
import { Button, Card, DataTable, PageHeader, Placeholder, StatCard } from "@/components/erp/ui";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StockCore ERP" },
      {
        name: "description",
        content:
          "Overview of stock health, purchases, sales and low-stock alerts in the StockCore ERP admin dashboard.",
      },
      { property: "og:title", content: "Dashboard — StockCore ERP" },
      {
        property: "og:description",
        content: "Overview of stock health, purchases, sales and low-stock alerts.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="A live overview of inventory value, movement and pending activity."
        actions={
          <>
            <Button variant="outline">Export summary</Button>
            <Button>New stock entry</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total products" icon={<Package className="size-5" />} />
        <StatCard label="Stock value" icon={<ArrowUpRight className="size-5" />} />
        <StatCard label="Purchases this month" icon={<ShoppingCart className="size-5" />} />
        <StatCard label="Sales this month" icon={<Receipt className="size-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Stock movement"
          description="Stock in versus stock out over time"
          actions={<Button variant="ghost">Last 30 days</Button>}
        >
          <div className="p-5">
            <Placeholder
              title="Chart area"
              body="A stock in / stock out trend chart will render here once movement records are available."
            />
          </div>
        </Card>

        <Card title="Low stock alerts" description="Items at or below reorder level">
          <div className="p-5">
            <Placeholder
              title="No alerts"
              body="Products falling below their reorder level will be listed here."
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Recent purchases"
          actions={
            <Link to="/purchases" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          <DataTable columns={["PO No.", "Supplier", "Date", "Items", "Status"]} />
        </Card>
        <Card
          title="Recent sales"
          actions={
            <Link to="/sales" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          <DataTable columns={["Invoice", "Customer", "Date", "Items", "Status"]} />
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active suppliers" icon={<Users className="size-5" />} />
        <StatCard label="Out of stock items" icon={<AlertTriangle className="size-5" />} />
        <StatCard label="Returns pending" icon={<ArrowDownRight className="size-5" />} />
      </div>
    </AdminLayout>
  );
}
