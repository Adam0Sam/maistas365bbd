// src/pages/api/recipe/select.ts
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Zod schema for validation
const SelectionSchema = z.object({
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
});
type SelectionResponse = z.infer<typeof SelectionSchema>;

export default async function handler(
   req: NextApiRequest,
   res: NextApiResponse
) {
   if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });

   const { recipe, requirements, ingredients, candidates } = req.body;
   if (!recipe || !requirements || !ingredients || !candidates) {
      return res
         .status(400)
         .json({
            error: "recipe, requirements, ingredients, and candidates are required",
         });
   }

   try {
      const completion = await openai.chat.completions.parse({
         model: "gpt-4o-mini",
         messages: [
            {
               role: "system",
               content:
                  "You are a cooking assistant. For each ingredient, pick the best matching product from candidates based on the requirements. Respond in strict JSON only.",
            },
            {
               role: "user",
               content: JSON.stringify({
                  recipe,
                  requirements,
                  ingredients,
                  candidates,
               }),
            },
         ],
         response_format: zodResponseFormat(SelectionSchema, "selection"),
      });

       const parsed = completion.choices[0].message?.parsed ?? "{}";

      return res.status(200).json(parsed);
   } catch (err: any) {
      console.error("Selection step error:", err);
      if (err instanceof z.ZodError) {
         return res
            .status(400)
            .json({ error: "Invalid AI response", details: err.errors });
      }
      return res.status(500).json({ error: err.message ?? "Unknown error" });
   }
}
