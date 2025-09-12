// src/pages/api/weaviate/search.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { weaviateClient } from "@/lib/weaviate";

const CLASS_NAME = "ProductsVectorized";

export default async function handler(
   req: NextApiRequest,
   res: NextApiResponse
) {
   if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
   }

   const { ingredients, fields, limit = 10 } = req.body;

   if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "ingredients array is required" });
   }

   const safeFields = Array.isArray(fields)
      ? [...fields, "productId"].join(" ")
      : "productId name price";

   try {
      const results: Record<string, any[]> = {};

      for (const ing of ingredients) {
         if (!ing?.search_description || !ing?.name) continue;

         const resp = await weaviateClient.graphql
            .get()
            .withClassName(CLASS_NAME)
            .withFields(safeFields)
            .withNearText({ concepts: [ing.search_description] })
            .withLimit(limit)
            .do();

         results[ing.name] = resp?.data?.Get?.[CLASS_NAME] ?? [];
      }

      res.status(200).json(results);
   } catch (err: any) {
      console.error("Weaviate query error:", err);
      res.status(500).json({ error: err.message ?? "Unknown error" });
   }
}
