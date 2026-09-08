import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { AdminLayout } from "@/components/erp/AdminLayout";
import {
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  StatCard,
  Table,
  Td,
} from "@/components/erp/ui";
import {
  COLLECTIONS,
  formatDate,
  formatDateTime,
  type Product,
  type StockTransaction,
} from "@/lib/collections";
import { useCollection } from "@/hooks/useFirestore";

export const Route = createFileRoute("/stock-history")({
  head: () => ({
    meta: [
      { title: "Stock In / Out History — StockCore ERP" },
      {
        name: "description",
        content:
          "Live audit trail of every stock movement in and out, linked to the purchase or sale that caused it.",
      },
      { property: "og:title", content: "Stock In / Out History — StockCore ERP" },
      { property: "og:description", content: "Live audit trail of every stock movement." },
    ],
  }),
  component: StockHistoryPage,
});

function StockHistoryPage() {
  const transactions = useCollection<StockTransaction>(COLLECTIONS.stockTransactions);
  const products = useCollection<Product>(COLLECTIONS.products);
  const [type, setType] = useState("");
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const productName = (id: string) =>
    products.data.find((p) => p.productId === id || p.id === id)?.productName ?? id;

  const filtered = useMemo(
    () =>
      transactions.data.filter(
        (t) =>
          (!type || t.type === type) &&
          (!productId || t.productId === productId) &&
          (!from || (t.date ?? "") >= from) &&
          (!to || (t.date ?? "") <= to),
      ),
    [transactions.data, type, productId, from, to],
  );

  const totalIn = filtered
    .filter((t) => t.type === "IN")
    .reduce((s, t) => s + Number(t.quantity ?? 0), 0);
  const totalOut = filtered
    .filter((t) => t.type === "OUT")
    .reduce((s, t) => s + Number(t.quantity ?? 0), 0);

  const reset = () => {
    setType("");
    setProductId("");
    setFrom("");
    setTo("");
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Stock In / Stock Out History"
        description="Every movement, newest first — written automatically whenever a purchase or sale is recorded."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Stock in (filtered)"
          value={totalIn}
          icon={<ArrowDownLeft className="size-5" />}
          loading={transactions.loading}
        />
        <StatCard
          label="Stock out (filtered)"
          value={totalOut}
          icon={<ArrowUpRight className="size-5" />}
          loading={transactions.loading}
        />
        <StatCard
          label="Net movement"
          value={totalIn - totalOut}
          loading={transactions.loading}
        />
      </div>

      <Card title="Filter movements">
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="From date" type="date" value={from} onChange={setFrom} />
          <Field label="To date" type="date" value={to} onChange={setTo} />
          <Field
            label="Movement type"
            as="select"
            options={[
              { value: "IN", label: "Stock in" },
              { value: "OUT", label: "Stock out" },
            ]}
            value={type}
            onChange={setType}
          />
          <Field
            label="Product"
            as="select"
            options={products.data.map((p) => ({
              value: p.productId ?? p.id,
              label: p.productName,
            }))}
            value={productId}
            onChange={setProductId}
          />
        </div>
        <div className="flex justify-end border-t border-border px-5 py-4">
          <Button variant="outline" onClick={reset}>
            Clear filters
          </Button>
        </div>
      </Card>

      <Card
        title="Movement log"
        description={`${filtered.length} movement${filtered.length === 1 ? "" : "s"} shown`}
      >
        <Table
          columns={["Reference", "Type", "Product", "Quantity", "Source", "Date", "Recorded"]}
          rows={filtered.length}
          loading={transactions.loading}
          error={transactions.error}
          emptyTitle={
            transactions.data.length ? "No movements match your filters" : "No movements yet"
          }
          emptyBody={
            transactions.data.length
              ? "Try widening the date range or clearing the filters."
              : "Movements are logged automatically when you record a purchase or a sale."
          }
        >
          {filtered.map((t) => (
            <tr key={t.id} className="hover:bg-muted/40">
              <Td className="font-mono text-xs text-muted-foreground">{t.transactionId}</Td>
              <Td>
                {t.type === "IN" ? (
                  <Badge tone="success">Stock in</Badge>
                ) : (
                  <Badge tone="danger">Stock out</Badge>
                )}
              </Td>
              <Td className="font-medium">{productName(t.productId)}</Td>
              <Td className={t.type === "IN" ? "font-semibold text-success" : "font-semibold text-destructive"}>
                {t.type === "IN" ? "+" : "−"}
                {t.quantity}
              </Td>
              <Td className="font-mono text-xs text-muted-foreground">{t.referenceId || "—"}</Td>
              <Td>{formatDate(t.date)}</Td>
              <Td className="text-muted-foreground">{formatDateTime(t.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </AdminLayout>
  );
}
