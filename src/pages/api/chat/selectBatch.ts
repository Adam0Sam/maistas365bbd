// src/pages/api/chat/selectBatch.ts
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Zod schema for batch selection
const BatchSelectionSchema = z.object({
   selections: z.array(
      z.object({
         recipe_index: z.number(),
         recipe_title: z.string(),
         shopping_list: z.array(
            z.object({
               ingredient: z.string(),
               chosen_product: z.object({
                  productId: z.string(),
                  name: z.string(),
                  price: z.number(),
                  shop: z.string(),
               }),
            })
         ),
      })
   ),
});
type BatchSelectionResponse = z.infer<typeof BatchSelectionSchema>;

export default async function handler(
   req: NextApiRequest,
   res: NextApiResponse
) {
   if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });

   const { recipes, requirements } = req.body;
   if (!recipes || !requirements) {
      return res
         .status(400)
         .json({
            error: "recipes array and requirements are required",
         });
   }

   if (!Array.isArray(recipes) || recipes.length === 0) {
      return res
         .status(400)
         .json({
            error: "recipes must be a non-empty array",
         });
   }

   try {
      // Process all recipes in a single API call
      const completion = await openai.chat.completions.parse({
         model: "gpt-4o-mini",
         messages: [
            {
               role: "system",
               content:
                  "You are a cooking assistant. For each recipe's ingredients, pick the best matching products from the candidates based on the requirements. " +
                  "Process all recipes and return selections for each. Respond in strict JSON only.",
            },
            {
               role: "user",
               content: JSON.stringify({
                  requirements,
                  recipes: recipes.map((r, idx) => ({
                     index: idx,
                     title: r.title || `Recipe ${idx + 1}`,
                     recipe: r.recipe,
                     ingredients: r.ingredients,
                     candidates: r.candidates,
                  })),
               }),
            },
         ],
         response_format: zodResponseFormat(BatchSelectionSchema, "batch_selection"),
      });

      const parsed = completion.choices[0].message?.parsed ?? { selections: [] };

      return res.status(200).json(parsed);
   } catch (err: any) {
      console.error("Batch selection step error:", err);
      if (err instanceof z.ZodError) {
         return res
            .status(400)
            .json({ error: "Invalid AI response", details: err.errors });
      }
      return res.status(500).json({ error: err.message ?? "Unknown error" });
   }
}