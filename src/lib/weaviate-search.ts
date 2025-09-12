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

   const results: Record<string, any[]> = {};
   for (const ing of ingredients) {
      if (!ing?.name || !ing?.search_description) continue;
      const resp = await weaviateClient.graphql
         .get()
         .withClassName(CLASS_NAME)
         .withFields(safeFields)
         .withNearText({ concepts: [ing.search_description] })
         .withLimit(limit)
         .do();

      results[ing.name] = resp?.data?.Get?.[CLASS_NAME] ?? [];
   }
   return results;
}
