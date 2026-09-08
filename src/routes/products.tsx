import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/erp/AdminLayout";
import { Button, Card, DataTable, Field, PageHeader, Toolbar } from "@/components/erp/ui";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Product Management — StockCore ERP" },
      {
        name: "description",
        content:
          "Create, categorise and maintain your product catalogue with SKUs, units, pricing and reorder levels.",
      },
      { property: "og:title", content: "Product Management — StockCore ERP" },
      {
        property: "og:description",
        content: "Maintain product catalogue, SKUs, pricing and reorder levels.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Product Management"
        description="Maintain the product catalogue: SKUs, categories, units, pricing and reorder levels."
        actions={
          <>
            <Button variant="outline">Import CSV</Button>
            <Button>Add product</Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card title="All products" description="Full catalogue listing">
          <Toolbar placeholder="Search by name or SKU">
            <Button variant="outline">Category</Button>
            <Button variant="outline">Status</Button>
          </Toolbar>
          <DataTable
            columns={[
              "SKU",
              "Product name",
              "Category",
              "Unit",
              "Purchase price",
              "Selling price",
              "Reorder level",
              "Actions",
            ]}
          />
        </Card>

        <Card title="Add product" description="Fields ready for the data layer">
          <form className="space-y-4 p-5">
            <Field label="Product name" placeholder="e.g. Steel bracket 12mm" />
            <Field label="SKU / Code" placeholder="SKU-0001" />
            <Field
              label="Category"
              as="select"
              options={["Raw material", "Finished goods", "Consumable", "Spare part"]}
            />
            <Field label="Unit" as="select" options={["Piece", "Box", "Kilogram", "Litre"]} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Purchase price" type="number" placeholder="0.00" />
              <Field label="Selling price" type="number" placeholder="0.00" />
            </div>
            <Field label="Reorder level" type="number" placeholder="0" />
            <Field label="Description" as="textarea" placeholder="Optional notes" />
            <div className="flex gap-2">
              <Button type="button" className="flex-1">
                Save product
              </Button>
              <Button type="reset" variant="outline">
                Reset
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
