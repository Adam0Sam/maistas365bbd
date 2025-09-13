import { weaviateClient } from "@/lib/weaviate";

export type IngredientInput = {
   name: string;
   search_description: string;
   quantity?: string;
};

export async function searchCandidatesForIngredients(
   ingredients: IngredientInput[],
   {
      fields = ["productId", "name", "price", "shop", "available"],
      limit = 5,
   }: { fields?: string[]; limit?: number } = {}
) {
   const safeFields = [...new Set([...fields, "productId"])].join(" ");
   const CLASS_NAME = "ProductsVectorized";
   const stores = ["iki", "rimi", "maxima"];

   const results: Record<string, Record<string, any[]>> = {};
   
   for (const ing of ingredients) {
      if (!ing?.name || !ing?.search_description) continue;
      results[ing.name] = {};
      
      // Search each store separately
      for (const store of stores) {
         const resp = await weaviateClient.graphql
            .get()
            .withClassName(CLASS_NAME)
            .withFields(safeFields)
            .withNearText({ concepts: [ing.search_description] })
            .withWhere({
               path: ["shop"],
               operator: "Equal",
               valueText: store
            })
            .withLimit(limit)
            .do();

         results[ing.name][store] = resp?.data?.Get?.[CLASS_NAME] ?? [];
      }
   }
   return results;
}
