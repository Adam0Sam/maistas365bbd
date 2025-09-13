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
   console.log(`📝 [planRecipe] Starting individual recipe planning`);
   console.log(`📝 [planRecipe] Recipe title: ${recipe.split('\n')[0]}`);
   console.log(`📝 [planRecipe] Requirements: ${requirements}`);
   console.log(`📝 [planRecipe] Fields: ${JSON.stringify(fields)}`);
   console.log(`📝 [planRecipe] Limit: ${limit}`);
   
   // 1) Extract ingredients
   console.log(`🥕 [planRecipe] Step 1: Extracting ingredients...`);
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
   
   console.log(`🥕 [planRecipe] Ingredient extraction response:`, JSON.stringify(extract, null, 2));
   
   if (!ingParsed) {
      console.log(`❌ [planRecipe] Failed to parse ingredients`);
      throw new Error("Failed to parse ingredients");
   }

   const ingredients = ingParsed.ingredients;
   console.log(`✅ [planRecipe] Successfully extracted ${ingredients.length} ingredients`);
   console.log(`🥕 [planRecipe] Ingredients:`, ingredients.map(i => i.name));

   // 2) Search Weaviate for candidates
   console.log(`🔍 [planRecipe] Step 2: Searching for product candidates...`);
   const candidates = await searchCandidatesForIngredients(ingredients, {
      fields,
      limit,
   });
   
   console.log(`✅ [planRecipe] Found ${Array.isArray(candidates) ? candidates.length : 'N/A'} candidates`);
   console.log(`🔍 [planRecipe] Candidates type:`, typeof candidates, Array.isArray(candidates) ? 'array' : 'object');

   // 3) Select shopping list
   console.log(`🛒 [planRecipe] Step 3: Selecting products from candidates...`);
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
   
   console.log(`🛒 [planRecipe] Product selection response:`, JSON.stringify(select, null, 2));
   
   if (!selection) {
      console.log(`❌ [planRecipe] Failed to parse selection`);
      throw new Error("Failed to parse selection");
   }
   
   console.log(`✅ [planRecipe] Successfully selected ${selection.shopping_list.length} products`);
   console.log(`🛒 [planRecipe] Shopping list:`, selection.shopping_list.map(s => ({ ingredient: s.ingredient, product: s.chosen_product.name })));
   
   const result = {
      ingredients,
      candidates,
      shopping_list: selection.shopping_list,
   };
   
   console.log(`✅ [planRecipe] Recipe planning completed successfully`);
   console.log(`📊 [planRecipe] Final result summary:`, {
      ingredientCount: result.ingredients.length,
      candidateCount: Array.isArray(result.candidates) ? result.candidates.length : 'object',
      shoppingListCount: result.shopping_list.length
   });
   
   return result;
}
