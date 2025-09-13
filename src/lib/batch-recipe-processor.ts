// src/lib/batch-recipe-processor.ts
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { searchCandidatesForIngredients } from "@/lib/weaviate-search";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Schemas for batch processing
const BatchIngredientSchema = z.object({
   name: z.string(),
   quantity: z.string(),
   search_description: z.string(),
});

const BatchRecipeIngredientsSchema = z.object({
   recipe_index: z.number(),
   recipe_title: z.string(),
   ingredients: z.array(BatchIngredientSchema).min(1),
});

const BatchIngredientsResponseSchema = z.object({
   recipes: z.array(BatchRecipeIngredientsSchema),
});

const BatchProductSelectionSchema = z.object({
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
});

const BatchSelectionsResponseSchema = z.object({
   selections: z.array(BatchProductSelectionSchema),
});

export type BatchIngredientsResponse = z.infer<typeof BatchIngredientsResponseSchema>;
export type BatchSelectionsResponse = z.infer<typeof BatchSelectionsResponseSchema>;

/**
 * Extract ingredients from all 6 recipes in a single API call
 */
export async function batchExtractIngredients(
   recipes: Array<{ title: string; text: string }>,
   requirements: string
): Promise<BatchIngredientsResponse> {
   const extract = await openai.chat.completions.parse({
      model: "gpt-5-mini-2025-08-07",
      messages: [
         {
            role: "system",
            content:
               "Extract ingredients with quantities and search descriptions for supermarket lookup from all provided recipes. " +
               "Each recipe should have its ingredients listed separately with the recipe index. " +
               "Respond in strict JSON.",
         },
         {
            role: "system",
            content: `Requirements for ingredient extraction: ${requirements}`,
         },
         {
            role: "user",
            content: JSON.stringify({
               recipes: recipes.map((r, idx) => ({
                  index: idx,
                  title: r.title,
                  recipe: r.text,
               })),
            }),
         },
      ],
      response_format: zodResponseFormat(
         BatchIngredientsResponseSchema,
         "batch_ingredients"
      ),
   });

   const parsed = extract.choices[0].message?.parsed as
      | BatchIngredientsResponse
      | undefined;
   if (!parsed) throw new Error("Failed to parse batch ingredients");

   return parsed;
}

/**
 * Select products for all recipes in a single API call
 */
export async function batchSelectProducts(
   recipesWithCandidates: Array<{
      index: number;
      title: string;
      recipe: string;
      ingredients: any[];
      candidates: any[];
   }>,
   requirements: string
): Promise<BatchSelectionsResponse> {
   const select = await openai.chat.completions.parse({
      model: "gpt-5-mini-2025-08-07",
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
               recipes: recipesWithCandidates,
            }),
         },
      ],
      response_format: zodResponseFormat(
         BatchSelectionsResponseSchema,
         "batch_selections"
      ),
   });

   const selection = select.choices[0].message?.parsed as
      | BatchSelectionsResponse
      | undefined;
   if (!selection) throw new Error("Failed to parse batch selections");

   return selection;
}

/**
 * Process all 6 recipes with only 3 OpenAI API calls total:
 * 1. Generate recipes (already done in generateAndParse)
 * 2. Extract all ingredients in batch
 * 3. Select all products in batch
 */
export async function processBatchRecipes(
   generatedRecipes: Array<{
      title: string;
      description: string;
      servings: number;
      ingredients: Array<{ name: string; quantity: string }>;
      instructions: string[];
   }>,
   requirements: string,
   fields?: string[],
   limit?: number
) {
   // Step 1: Prepare recipe texts
   const recipeTexts = generatedRecipes.map((r) => ({
      title: r.title,
      text:
         `Title: ${r.title}\n` +
         (r.description ? `Description: ${r.description}\n` : "") +
         (typeof r.servings === "number" ? `Servings: ${r.servings}\n` : "") +
         `Ingredients:\n` +
         r.ingredients
            .map((i) => `- ${i.quantity ?? ""} ${i.name}`.trim())
            .join("\n") +
         `\nInstructions:\n` +
         r.instructions.map((step, idx) => `${idx + 1}. ${step}`).join("\n"),
   }));

   // Step 2: Extract ingredients for all recipes in one call
   const batchIngredients = await batchExtractIngredients(recipeTexts, requirements);

   // Step 3: Search Weaviate for candidates for all ingredients
   const recipesWithCandidates = await Promise.all(
      batchIngredients.recipes.map(async (recipe) => {
         const candidates = await searchCandidatesForIngredients(
            recipe.ingredients,
            { fields, limit }
         );
         return {
            index: recipe.recipe_index,
            title: recipe.recipe_title,
            recipe: recipeTexts[recipe.recipe_index].text,
            ingredients: recipe.ingredients,
            candidates,
         };
      })
   );

   // Step 4: Select products for all recipes in one call
   const batchSelections = await batchSelectProducts(
      recipesWithCandidates,
      requirements
   );

   // Step 5: Combine results
   return generatedRecipes.map((generated, idx) => {
      const ingredients = batchIngredients.recipes.find(
         (r) => r.recipe_index === idx
      )?.ingredients;
      const selection = batchSelections.selections.find(
         (s) => s.recipe_index === idx
      );
      const candidatesForRecipe = recipesWithCandidates.find(
         (r) => r.index === idx
      )?.candidates;

      return {
         ok: true as const,
         title: generated.title,
         generated,
         plan: {
            ingredients: ingredients || [],
            candidates: candidatesForRecipe || [],
            shopping_list: selection?.shopping_list || [],
         },
      };
   });
}