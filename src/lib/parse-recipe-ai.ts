// src/lib/planRecipe.ts
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { searchCandidatesForIngredients } from "@/lib/weaviate-search";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const IngredientSchema = z.object({
   name: z.string(),
   quantity: z.string(),
   search_description: z.string(),
});
export const IngredientsResponseSchema = z.object({
   ingredients: z.array(IngredientSchema).min(1),
});
export type IngredientsResponse = z.infer<typeof IngredientsResponseSchema>;

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

// ---- Core function ----
export async function planRecipe({
   recipe,
   requirements,
   fields,
   limit,
}: {
   recipe: string;
   requirements: string;
   fields?: string[];
   limit?: number;
}) {
   // 1) Extract ingredients
   const extract = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
         {
            role: "system",
            content:
               "Extract ingredients with quantities and search descriptions for supermarket lookup. Respond in strict JSON.",
         },
         {
            role: "system",
            content: `requirements for weaviate ${requirements}`,
         },
         { role: "user", content: recipe },
      ],
      response_format: zodResponseFormat(
         IngredientsResponseSchema,
         "ingredients"
      ),
   });

   const ingParsed = extract.choices[0].message?.parsed as
      | IngredientsResponse
      | undefined;
   if (!ingParsed) throw new Error("Failed to parse ingredients");

   const ingredients = ingParsed.ingredients;

   // 2) Search Weaviate for candidates
   const candidates = await searchCandidatesForIngredients(ingredients, {
      fields,
      limit,
   });

   // 3) Select shopping list
   const select = await openai.chat.completions.parse({
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

   const selection = select.choices[0].message?.parsed as
      | SelectionResponse
      | undefined;
   if (!selection) throw new Error("Failed to parse selection");

   return {
      ingredients,
      candidates,
      shopping_list: selection.shopping_list,
   };
}
