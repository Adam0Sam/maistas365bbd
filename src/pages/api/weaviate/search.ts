// src/pages/api/weaviate/search.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { weaviateClient } from "@/lib/weaviate";

export default async function handler(
   req: NextApiRequest,
   res: NextApiResponse
) {
   if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
   }

   const { query, fields, limit = 10 } = req.body;

   if (!query || !fields) {
      return res.status(400).json({ error: "query and fields required" });
   }

   const safeFields = Array.isArray(fields)
      ? [...fields, "productId"].join(" ")
      : "productId name price";

   try {
      // Now using vector search
      const result = await weaviateClient.graphql
         .get()
         .withClassName("ProductsVectorized") 
         .withFields(safeFields)
         .withNearText({ concepts: [query] }) 
         .withLimit(limit)
         .do();

      res.status(200).json(result.data.Get.ProductsVectorized ?? []);
   } catch (err: any) {
      console.error("Weaviate query error:", err);
      res.status(500).json({ error: err.message ?? "Unknown error" });
   }
}
