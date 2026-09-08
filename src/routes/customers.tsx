import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/erp/AdminLayout";
import { Button, Card, DataTable, Field, PageHeader, StatCard, Toolbar } from "@/components/erp/ui";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customer Management — StockCore ERP" },
      {
        name: "description",
        content:
          "Manage customer records, billing details, credit limits and order history from a single directory.",
      },
      { property: "og:title", content: "Customer Management — StockCore ERP" },
      {
        property: "og:description",
        content: "Customer records, billing details, credit limits and order history.",
      },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Customer Management"
        description="Customer records, billing details, credit limits and order history."
        actions={<Button>Add customer</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total customers" />
        <StatCard label="New this month" />
        <StatCard label="Outstanding receivables" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card title="Customer directory">
          <Toolbar placeholder="Search customers">
            <Button variant="outline">Type</Button>
          </Toolbar>
          <DataTable
            columns={[
              "Code",
              "Customer name",
              "Type",
              "Phone",
              "Email",
              "City",
              "Credit limit",
              "Actions",
            ]}
          />
        </Card>

        <Card title="Add customer">
          <form className="space-y-4 p-5">
            <Field label="Customer name" placeholder="Company or person" />
            <Field label="Customer type" as="select" options={["Retail", "Wholesale", "Distributor"]} />
            <Field label="Phone" type="tel" placeholder="+00 00000 00000" />
            <Field label="Email" type="email" placeholder="buyer@customer.com" />
            <Field label="GST / Tax ID" placeholder="Tax identifier" />
            <Field label="Billing address" as="textarea" placeholder="Street, city, postal code" />
            <Field label="Credit limit" type="number" placeholder="0.00" />
            <Button type="button" className="w-full">
              Save customer
            </Button>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
