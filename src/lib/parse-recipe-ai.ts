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
   shopping_lists: z.object({
      iki: z.array(
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
      rimi: z.array(
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
      maxima: z.array(
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
   }),
});
type SelectionResponse = z.infer<typeof SelectionSchema>;

export async function planRecipe({
   recipe,
   requirements,
   fields,
   limit,
   ingredients: providedIngredients,
}: {
   recipe: string;
   requirements: string;
   fields?: string[];
   limit?: number;
   ingredients: Array<{ name: string; quantity: string }>;
}) {
   console.log(`📝 [planRecipe] Starting with ${providedIngredients.length} provided ingredients`);
   
   // 1) Enhance provided ingredients with search descriptions
   console.log(`🥕 [planRecipe] Step 1: Enhancing ingredients with search descriptions...`);
   const enhance = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [ 
         {
            role: "system",
            content:
               "For each ingredient, create an optimized search description for supermarket product lookup. Consider the recipe context and requirements. Respond in strict JSON.",
         },
         {
            role: "system",
            content: `Recipe context: ${recipe}\nRequirements for weaviate: ${requirements}`,
         },
         { 
            role: "user", 
            content: JSON.stringify({
               ingredients: providedIngredients,
               recipe_title: recipe.split('\n')[0],
               requirements
            })
         },
      ],
      response_format: zodResponseFormat(
         IngredientsResponseSchema,
         "ingredients"
      ),
   });

   const ingParsed = enhance.choices[0].message?.parsed as
      | IngredientsResponse
      | undefined;
   
   console.log(`🥕 [planRecipe] Ingredient enhancement response:`, JSON.stringify(enhance, null, 2));
   
   if (!ingParsed) {
      console.log(`❌ [planRecipe] Failed to enhance ingredients`);
      throw new Error("Failed to enhance ingredients");
   }

   const ingredients = ingParsed.ingredients;
   console.log(`✅ [planRecipe] Successfully enhanced ${ingredients.length} ingredients`);
   console.log(`🥕 [planRecipe] Enhanced ingredients:`, ingredients.map(i => `${i.name} (${i.search_description})`));

   // 2) Search Weaviate for candidates
   console.log(`🔍 [planRecipe] Step 2: Searching for product candidates...`);
   const candidates = await searchCandidatesForIngredients(ingredients, {
      fields,
      limit,
   });
   
   console.log(`✅ [planRecipe] Found candidates for ${Object.keys(candidates).length} ingredients`);
   console.log(`🔍 [planRecipe] Store breakdown:`, Object.entries(candidates).map(([ing, stores]: [string, any]) => 
      `${ing}: iki(${stores.iki?.length || 0}), rimi(${stores.rimi?.length || 0}), maxima(${stores.maxima?.length || 0})`).join(', '));

   // 3) Select shopping list
   console.log(`🛒 [planRecipe] Step 3: Selecting products from candidates...`);
   const select = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
         {
            role: "system",
            content:
               "You are a cooking assistant. For each ingredient, pick the best matching product from each store (iki, rimi, maxima) based on the requirements. Create separate shopping lists for each store. Respond in strict JSON only.",
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
   
   const totalItems = (selection.shopping_lists.iki?.length || 0) + (selection.shopping_lists.rimi?.length || 0) + (selection.shopping_lists.maxima?.length || 0);
   console.log(`✅ [planRecipe] Successfully selected ${totalItems} products across all stores`);
   console.log(`🛒 [planRecipe] Store shopping lists:`);
   console.log(`  iki: ${selection.shopping_lists.iki?.map(s => s.chosen_product.name).join(', ') || 'none'}`);
   console.log(`  rimi: ${selection.shopping_lists.rimi?.map(s => s.chosen_product.name).join(', ') || 'none'}`);
   console.log(`  maxima: ${selection.shopping_lists.maxima?.map(s => s.chosen_product.name).join(', ') || 'none'}`);
   
   const result = {
      ingredients,
      candidates,
      shopping_lists: selection.shopping_lists,
   };
   
   console.log(`✅ [planRecipe] Recipe planning completed successfully`);
   console.log(`📊 [planRecipe] Final result summary:`, {
      ingredientCount: result.ingredients.length,
      candidateCount: Object.keys(result.candidates).length,
      shoppingListCounts: {
         iki: result.shopping_lists.iki?.length || 0,
         rimi: result.shopping_lists.rimi?.length || 0,
         maxima: result.shopping_lists.maxima?.length || 0
      }
   });
   
   return result;
}
