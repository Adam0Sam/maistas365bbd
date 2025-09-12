import { weaviateClient } from "./weaviate";

export async function ensureProductsClass() {
   const className = "Products";

   const classes = await weaviateClient.schema.getter().do();
   const exists = classes.classes?.some((c) => c.class === className);
   if (exists) return;

   await weaviateClient.schema
      .classCreator()
      .withClass({
         class: className,
         description: "Product catalog items",
         properties: [
            {
               name: "url",
               dataType: ["text"],
               description: "Product URL",
               indexFilterable: true,
            },
            {
               name: "available",
               dataType: ["boolean"],
               description: "In stock",
               indexFilterable: true,
            },
            { name: "unit", dataType: ["text"], indexFilterable: true },
            { name: "name", dataType: ["text"], indexFilterable: true },
            { name: "image", dataType: ["text"] },
            { name: "shop", dataType: ["text"], indexFilterable: true },
            { name: "categoryId", dataType: ["text"], indexFilterable: true },
            { name: "price", dataType: ["number"], indexFilterable: true },
            { name: "pricePer", dataType: ["number"], indexFilterable: true },
            {
               name: "productId",
               dataType: ["text"],
               description: "External ID",
               indexFilterable: true,
            },
         ],
      })
      .do();
}
