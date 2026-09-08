import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/erp/AdminLayout";
import { Button, Card, Field, PageHeader, StatCard, Table, Td } from "@/components/erp/ui";
import {
  COLLECTIONS,
  formatDate,
  formatMoney,
  type Product,
  type Purchase,
  type Sale,
} from "@/lib/collections";
import { useCollection } from "@/hooks/useFirestore";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — StockCore ERP" },
      {
        name: "description",
        content:
          "Stock valuation, purchase, sales, low-stock and profit margin reports generated from your live records.",
      },
      { property: "og:title", content: "Reports — StockCore ERP" },
      {
        property: "og:description",
        content: "Stock valuation, purchase, sales, low-stock and margin reports.",
      },
    ],
  }),
  component: ReportsPage,
});

type ReportKey = "valuation" | "purchases" | "sales" | "low" | "margin";

const REPORTS: { value: ReportKey; label: string }[] = [
  { value: "valuation", label: "Stock valuation" },
  { value: "purchases", label: "Purchase report" },
  { value: "sales", label: "Sales report" },
  { value: "low", label: "Low stock" },
  { value: "margin", label: "Profit margin" },
];

const LOW_STOCK = 10;

function ReportsPage() {
  const products = useCollection<Product>(COLLECTIONS.products);
  const purchases = useCollection<Purchase>(COLLECTIONS.purchases);
  const sales = useCollection<Sale>(COLLECTIONS.sales);
  const [report, setReport] = useState<ReportKey>("valuation");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const productName = (id: string) =>
    products.data.find((p) => p.productId === id || p.id === id)?.productName ?? id;

  const inRange = (date: string | undefined) =>
    (!from || (date ?? "") >= from) && (!to || (date ?? "") <= to);

  const rangedPurchases = useMemo(
    () => purchases.data.filter((p) => inRange(p.purchaseDate)),
    [purchases.data, from, to],
  );
  const rangedSales = useMemo(
    () => sales.data.filter((s) => inRange(s.saleDate)),
    [sales.data, from, to],
  );

  const purchaseValue = rangedPurchases.reduce(
    (s, p) => s + Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0),
    0,
  );
  const salesValue = rangedSales.reduce(
    (s, x) => s + Number(x.quantity ?? 0) * Number(x.sellingPrice ?? 0),
    0,
  );

  const loading = products.loading || purchases.loading || sales.loading;
  const error = products.error ?? purchases.error ?? sales.error;

  const marginRows = products.data.map((p) => {
    const key = p.productId ?? p.id;
    const sold = rangedSales
      .filter((s) => s.productId === key)
      .reduce((sum, s) => sum + Number(s.quantity ?? 0), 0);
    const revenue = rangedSales
      .filter((s) => s.productId === key)
      .reduce((sum, s) => sum + Number(s.quantity ?? 0) * Number(s.sellingPrice ?? 0), 0);
    const cost = sold * Number(p.purchasePrice ?? 0);
    return { p, sold, revenue, profit: revenue - cost };
  });

  const lowRows = products.data
    .filter((p) => Number(p.quantity ?? 0) <= LOW_STOCK)
    .sort((a, b) => Number(a.quantity ?? 0) - Number(b.quantity ?? 0));

  const exportCsv = () => {
    const rows: string[][] = [];
    if (report === "valuation") {
      rows.push(["Code", "Product", "Quantity", "Purchase price", "Valuation"]);
      products.data.forEach((p) =>
        rows.push([
          p.productId ?? "",
          p.productName ?? "",
          String(p.quantity ?? 0),
          String(p.purchasePrice ?? 0),
          String(Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0)),
        ]),
      );
    } else if (report === "purchases") {
      rows.push(["Reference", "Product", "Quantity", "Unit price", "Total", "Date"]);
      rangedPurchases.forEach((p) =>
        rows.push([
          p.purchaseId ?? "",
          productName(p.productId),
          String(p.quantity ?? 0),
          String(p.purchasePrice ?? 0),
          String(Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0)),
          p.purchaseDate ?? "",
        ]),
      );
    } else if (report === "sales") {
      rows.push(["Reference", "Product", "Quantity", "Unit price", "Total", "Date"]);
      rangedSales.forEach((s) =>
        rows.push([
          s.saleId ?? "",
          productName(s.productId),
          String(s.quantity ?? 0),
          String(s.sellingPrice ?? 0),
          String(Number(s.quantity ?? 0) * Number(s.sellingPrice ?? 0)),
          s.saleDate ?? "",
        ]),
      );
    } else if (report === "low") {
      rows.push(["Code", "Product", "Quantity"]);
      lowRows.forEach((p) => rows.push([p.productId ?? "", p.productName ?? "", String(p.quantity ?? 0)]));
    } else {
      rows.push(["Code", "Product", "Units sold", "Revenue", "Profit"]);
      marginRows.forEach((r) =>
        rows.push([
          r.p.productId ?? "",
          r.p.productName ?? "",
          String(r.sold),
          String(r.revenue),
          String(r.profit),
        ]),
      );
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasRows =
    report === "valuation" || report === "margin" || report === "low"
      ? products.data.length > 0
      : report === "purchases"
        ? rangedPurchases.length > 0
        : rangedSales.length > 0;

  return (
    <AdminLayout>
      <PageHeader
        title="Reports"
        description="Built from your live records. Pick a report, set a date range and export it."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!hasRows}>
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Purchase value (range)" value={formatMoney(purchaseValue)} loading={loading} />
        <StatCard label="Sales value (range)" value={formatMoney(salesValue)} loading={loading} />
        <StatCard label="Gross difference" value={formatMoney(salesValue - purchaseValue)} loading={loading} />
        <StatCard label="Low stock items" value={lowRows.length} loading={loading} />
      </div>

      <Card title="Report parameters">
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Field
            label="Report type"
            as="select"
            options={REPORTS}
            value={report}
            onChange={(v) => setReport(v as ReportKey)}
          />
          <Field label="From date" type="date" value={from} onChange={setFrom} />
          <Field label="To date" type="date" value={to} onChange={setTo} />
        </div>
        <div className="flex justify-end border-t border-border px-5 py-4">
          <Button
            variant="outline"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Clear dates
          </Button>
        </div>
      </Card>

      <Card title={REPORTS.find((r) => r.value === report)?.label}>
        {report === "valuation" ? (
          <Table
            columns={["Code", "Product", "Category", "Quantity", "Purchase price", "Valuation"]}
            rows={products.data.length}
            loading={loading}
            error={error}
            emptyTitle="No products yet"
            emptyBody="Add products to see their stock valuation."
          >
            {products.data.map((p) => (
              <tr key={p.id} className="hover:bg-muted/40">
                <Td className="font-mono text-xs text-muted-foreground">{p.productId}</Td>
                <Td className="font-medium">{p.productName}</Td>
                <Td className="text-muted-foreground">{p.category || "—"}</Td>
                <Td>{p.quantity ?? 0}</Td>
                <Td>{formatMoney(p.purchasePrice)}</Td>
                <Td className="font-semibold">
                  {formatMoney(Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0))}
                </Td>
              </tr>
            ))}
          </Table>
        ) : report === "purchases" ? (
          <Table
            columns={["Reference", "Product", "Quantity", "Unit price", "Total", "Date"]}
            rows={rangedPurchases.length}
            loading={loading}
            error={error}
            emptyTitle="No purchases in this range"
            emptyBody="Widen the date range or record a purchase."
          >
            {rangedPurchases.map((p) => (
              <tr key={p.id} className="hover:bg-muted/40">
                <Td className="font-mono text-xs text-muted-foreground">{p.purchaseId}</Td>
                <Td className="font-medium">{productName(p.productId)}</Td>
                <Td>{p.quantity}</Td>
                <Td>{formatMoney(p.purchasePrice)}</Td>
                <Td className="font-semibold">
                  {formatMoney(Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0))}
                </Td>
                <Td className="text-muted-foreground">{formatDate(p.purchaseDate)}</Td>
              </tr>
            ))}
          </Table>
        ) : report === "sales" ? (
          <Table
            columns={["Reference", "Product", "Quantity", "Unit price", "Total", "Date"]}
            rows={rangedSales.length}
            loading={loading}
            error={error}
            emptyTitle="No sales in this range"
            emptyBody="Widen the date range or record a sale."
          >
            {rangedSales.map((s) => (
              <tr key={s.id} className="hover:bg-muted/40">
                <Td className="font-mono text-xs text-muted-foreground">{s.saleId}</Td>
                <Td className="font-medium">{productName(s.productId)}</Td>
                <Td>{s.quantity}</Td>
                <Td>{formatMoney(s.sellingPrice)}</Td>
                <Td className="font-semibold">
                  {formatMoney(Number(s.quantity ?? 0) * Number(s.sellingPrice ?? 0))}
                </Td>
                <Td className="text-muted-foreground">{formatDate(s.saleDate)}</Td>
              </tr>
            ))}
          </Table>
        ) : report === "low" ? (
          <Table
            columns={["Code", "Product", "Category", "Quantity on hand"]}
            rows={lowRows.length}
            loading={loading}
            error={error}
            emptyTitle="Nothing is running low"
            emptyBody="Products at or below 10 units will be listed here."
          >
            {lowRows.map((p) => (
              <tr key={p.id} className="hover:bg-muted/40">
                <Td className="font-mono text-xs text-muted-foreground">{p.productId}</Td>
                <Td className="font-medium">{p.productName}</Td>
                <Td className="text-muted-foreground">{p.category || "—"}</Td>
                <Td className="font-semibold">{p.quantity ?? 0}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Table
            columns={["Code", "Product", "Units sold", "Revenue", "Profit"]}
            rows={products.data.length}
            loading={loading}
            error={error}
            emptyTitle="No products yet"
            emptyBody="Add products and record sales to see margins."
          >
            {marginRows.map((r) => (
              <tr key={r.p.id} className="hover:bg-muted/40">
                <Td className="font-mono text-xs text-muted-foreground">{r.p.productId}</Td>
                <Td className="font-medium">{r.p.productName}</Td>
                <Td>{r.sold}</Td>
                <Td>{formatMoney(r.revenue)}</Td>
                <Td className={r.profit >= 0 ? "font-semibold text-success" : "font-semibold text-destructive"}>
                  {formatMoney(r.profit)}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </AdminLayout>
  );
}
