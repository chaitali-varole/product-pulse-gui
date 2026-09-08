import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Package, Receipt, ShoppingCart, Truck, Users, Warehouse } from "lucide-react";
import { AdminLayout } from "@/components/erp/AdminLayout";
import { Badge, Card, PageHeader, StatCard, Table, Td } from "@/components/erp/ui";
import {
  COLLECTIONS,
  formatDate,
  formatMoney,
  type Customer,
  type Product,
  type Purchase,
  type Sale,
  type StockTransaction,
  type Supplier,
} from "@/lib/collections";
import { useCollection } from "@/hooks/useFirestore";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StockCore ERP" },
      {
        name: "description",
        content:
          "Live overview of stock value, purchases, sales, recent movements and low-stock alerts across your business.",
      },
      { property: "og:title", content: "Dashboard — StockCore ERP" },
      {
        property: "og:description",
        content: "Live overview of stock value, purchases, sales and low-stock alerts.",
      },
    ],
  }),
  component: DashboardPage,
});

const LOW_STOCK = 10;
const thisMonth = new Date().toISOString().slice(0, 7);

function DashboardPage() {
  const products = useCollection<Product>(COLLECTIONS.products);
  const suppliers = useCollection<Supplier>(COLLECTIONS.suppliers);
  const customers = useCollection<Customer>(COLLECTIONS.customers);
  const purchases = useCollection<Purchase>(COLLECTIONS.purchases);
  const sales = useCollection<Sale>(COLLECTIONS.sales);
  const transactions = useCollection<StockTransaction>(COLLECTIONS.stockTransactions);

  const productName = (id: string) =>
    products.data.find((p) => p.productId === id || p.id === id)?.productName ?? id;

  const valuation = products.data.reduce(
    (s, p) => s + Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0),
    0,
  );
  const monthPurchases = purchases.data
    .filter((p) => (p.purchaseDate ?? "").startsWith(thisMonth))
    .reduce((s, p) => s + Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0), 0);
  const monthSales = sales.data
    .filter((s) => (s.saleDate ?? "").startsWith(thisMonth))
    .reduce((s, x) => s + Number(x.quantity ?? 0) * Number(x.sellingPrice ?? 0), 0);

  const lowStock = products.data
    .filter((p) => Number(p.quantity ?? 0) <= LOW_STOCK)
    .sort((a, b) => Number(a.quantity ?? 0) - Number(b.quantity ?? 0))
    .slice(0, 6);

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Everything below reads straight from your live records and updates the moment anything changes."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total products"
          value={products.data.length}
          icon={<Package className="size-5" />}
          loading={products.loading}
        />
        <StatCard
          label="Stock valuation"
          value={products.data.length ? formatMoney(valuation) : undefined}
          hint="At purchase price"
          icon={<Warehouse className="size-5" />}
          loading={products.loading}
        />
        <StatCard
          label="Purchases this month"
          value={purchases.data.length ? formatMoney(monthPurchases) : undefined}
          icon={<ShoppingCart className="size-5" />}
          loading={purchases.loading}
        />
        <StatCard
          label="Sales this month"
          value={sales.data.length ? formatMoney(monthSales) : undefined}
          icon={<Receipt className="size-5" />}
          loading={sales.loading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Suppliers"
          value={suppliers.data.length}
          icon={<Truck className="size-5" />}
          loading={suppliers.loading}
        />
        <StatCard
          label="Customers"
          value={customers.data.length}
          icon={<Users className="size-5" />}
          loading={customers.loading}
        />
        <StatCard
          label="Out of stock items"
          value={products.data.filter((p) => Number(p.quantity ?? 0) <= 0).length}
          icon={<AlertTriangle className="size-5" />}
          loading={products.loading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Latest stock movements"
          actions={
            <Link to="/stock-history" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          <Table
            columns={["Reference", "Type", "Product", "Quantity", "Date"]}
            rows={Math.min(transactions.data.length, 6)}
            loading={transactions.loading}
            error={transactions.error}
            emptyTitle="No movements yet"
            emptyBody="Record a purchase or a sale and it will show up here immediately."
          >
            {transactions.data.slice(0, 6).map((t) => (
              <tr key={t.id} className="hover:bg-muted/40">
                <Td className="font-mono text-xs text-muted-foreground">{t.referenceId}</Td>
                <Td>
                  {t.type === "IN" ? (
                    <Badge tone="success">In</Badge>
                  ) : (
                    <Badge tone="danger">Out</Badge>
                  )}
                </Td>
                <Td className="font-medium">{productName(t.productId)}</Td>
                <Td>
                  {t.type === "IN" ? "+" : "−"}
                  {t.quantity}
                </Td>
                <Td className="text-muted-foreground">{formatDate(t.date)}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="Low stock alerts" description={`${LOW_STOCK} units or fewer`}>
          <div className="divide-y divide-border">
            {products.loading ? (
              <p className="px-5 py-10 text-center text-xs text-muted-foreground">Loading…</p>
            ) : lowStock.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Nothing needs reordering right now.
              </p>
            ) : (
              lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.productName}</p>
                    <p className="text-xs text-muted-foreground">{p.category || "Uncategorised"}</p>
                  </div>
                  {Number(p.quantity ?? 0) <= 0 ? (
                    <Badge tone="danger">Out</Badge>
                  ) : (
                    <Badge tone="warning">{p.quantity} left</Badge>
                  )}
                </div>
              ))
            )}
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
          <Table
            columns={["Reference", "Product", "Qty", "Total", "Date"]}
            rows={Math.min(purchases.data.length, 5)}
            loading={purchases.loading}
            error={purchases.error}
            emptyTitle="No purchases yet"
            emptyBody="Recorded purchases appear here with their totals."
          >
            {purchases.data.slice(0, 5).map((p) => (
              <tr key={p.id} className="hover:bg-muted/40">
                <Td className="font-mono text-xs text-muted-foreground">{p.purchaseId}</Td>
                <Td className="font-medium">{productName(p.productId)}</Td>
                <Td>{p.quantity}</Td>
                <Td>{formatMoney(Number(p.quantity ?? 0) * Number(p.purchasePrice ?? 0))}</Td>
                <Td className="text-muted-foreground">{formatDate(p.purchaseDate)}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card
          title="Recent sales"
          actions={
            <Link to="/sales" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          <Table
            columns={["Reference", "Product", "Qty", "Total", "Date"]}
            rows={Math.min(sales.data.length, 5)}
            loading={sales.loading}
            error={sales.error}
            emptyTitle="No sales yet"
            emptyBody="Recorded sales appear here with their totals."
          >
            {sales.data.slice(0, 5).map((s) => (
              <tr key={s.id} className="hover:bg-muted/40">
                <Td className="font-mono text-xs text-muted-foreground">{s.saleId}</Td>
                <Td className="font-medium">{productName(s.productId)}</Td>
                <Td>{s.quantity}</Td>
                <Td>{formatMoney(Number(s.quantity ?? 0) * Number(s.sellingPrice ?? 0))}</Td>
                <Td className="text-muted-foreground">{formatDate(s.saleDate)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
