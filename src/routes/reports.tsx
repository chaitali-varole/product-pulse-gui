import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { AdminLayout } from "@/components/erp/AdminLayout";
import { Button, Card, Field, PageHeader, Placeholder } from "@/components/erp/ui";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — StockCore ERP" },
      {
        name: "description",
        content:
          "Generate stock valuation, purchase, sales, movement and low-stock reports for any period.",
      },
      { property: "og:title", content: "Reports — StockCore ERP" },
      {
        property: "og:description",
        content: "Stock valuation, purchase, sales, movement and low-stock reports.",
      },
    ],
  }),
  component: ReportsPage,
});

const reports = [
  { icon: Boxes, title: "Stock valuation", body: "Closing quantity and value by product." },
  { icon: ShoppingCart, title: "Purchase report", body: "Purchases by supplier, product or period." },
  { icon: Receipt, title: "Sales report", body: "Sales by customer, product or period." },
  { icon: ArrowLeftRight, title: "Stock movement", body: "Inward and outward flow over time." },
  { icon: AlertTriangle, title: "Low stock", body: "Items at or below reorder level." },
  { icon: BarChart3, title: "Fast / slow movers", body: "Ranked product turnover." },
  { icon: Users, title: "Supplier & customer ledger", body: "Party-wise transaction summary." },
  { icon: Wallet, title: "Profit margin", body: "Margin by product and category." },
];

function ReportsPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Reports"
        description="Generate and export operational reports for any date range."
        actions={<Button variant="outline">Scheduled reports</Button>}
      />

      <Card title="Report parameters">
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Report type" as="select" options={reports.map((r) => r.title)} />
          <Field label="From date" type="date" />
          <Field label="To date" type="date" />
          <Field label="Format" as="select" options={["On screen", "PDF", "Excel", "CSV"]} />
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline">Reset</Button>
          <Button>Generate report</Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reports.map(({ icon: Icon, title, body }) => (
          <button
            key={title}
            className="rounded-xl border border-border bg-card p-5 text-left shadow-card transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
              <Icon className="size-4" />
            </span>
            <p className="mt-3 font-display text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{body}</p>
          </button>
        ))}
      </div>

      <Card title="Report output">
        <div className="p-5">
          <Placeholder
            title="Nothing generated yet"
            body="Choose a report type and date range, then generate — results will render in this panel."
          />
        </div>
      </Card>
    </AdminLayout>
  );
}
