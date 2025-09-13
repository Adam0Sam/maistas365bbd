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
   console.log(`🥕 [batchExtractIngredients] Starting batch ingredient extraction for ${recipes.length} recipes`);
   console.log(`🥕 [batchExtractIngredients] Requirements: ${requirements}`);
   console.log(`🥕 [batchExtractIngredients] Recipe titles:`, recipes.map(r => r.title));
   
   const extract = await openai.chat.completions.parse({
         model: "gpt-4o-mini",
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
   
   console.log(`🥕 [batchExtractIngredients] OpenAI response received`);
   console.log(`🥕 [batchExtractIngredients] Raw response:`, JSON.stringify(extract, null, 2));
   
   if (!parsed) {
      console.log(`❌ [batchExtractIngredients] Failed to parse batch ingredients`);
      throw new Error("Failed to parse batch ingredients");
   }
   
   console.log(`✅ [batchExtractIngredients] Successfully extracted ingredients for ${parsed.recipes.length} recipes`);
   console.log(`🥕 [batchExtractIngredients] Extracted ingredients summary:`, 
      parsed.recipes.map(r => ({ recipe: r.recipe_title, ingredientCount: r.ingredients.length })));

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
   console.log(`🛒 [batchSelectProducts] Starting batch product selection for ${recipesWithCandidates.length} recipes`);
   console.log(`🛒 [batchSelectProducts] Requirements: ${requirements}`);
   console.log(`🛒 [batchSelectProducts] Recipe summary:`, 
      recipesWithCandidates.map(r => ({ 
         index: r.index, 
         title: r.title, 
         ingredientCount: r.ingredients.length,
         candidateCount: Array.isArray(r.candidates) ? r.candidates.length : 'N/A'
      })));
   
   const select = await openai.chat.completions.parse({
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
   
   console.log(`🛒 [batchSelectProducts] OpenAI response received`);
   console.log(`🛒 [batchSelectProducts] Raw response:`, JSON.stringify(select, null, 2));
   
   if (!selection) {
      console.log(`❌ [batchSelectProducts] Failed to parse batch selections`);
      throw new Error("Failed to parse batch selections");
   }
   
   console.log(`✅ [batchSelectProducts] Successfully selected products for ${selection.selections.length} recipes`);
   console.log(`🛒 [batchSelectProducts] Selection summary:`, 
      selection.selections.map(s => ({ recipe: s.recipe_title, itemCount: s.shopping_list.length })));

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
   console.log(`🍳 [processBatchRecipes] Starting batch processing of ${generatedRecipes.length} recipes`);
   console.log(`🍳 [processBatchRecipes] Requirements: ${requirements}`);
   console.log(`🍳 [processBatchRecipes] Fields: ${JSON.stringify(fields)}`);
   console.log(`🍳 [processBatchRecipes] Limit: ${limit}`);
   console.log(`🍳 [processBatchRecipes] Recipe titles:`, generatedRecipes.map(r => r.title));
   
   // Step 1: Prepare recipe texts
   console.log(`📝 [processBatchRecipes] Step 1: Preparing recipe texts...`);
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

   console.log(`📝 [processBatchRecipes] Recipe texts prepared:`, recipeTexts.map(r => ({ title: r.title, textLength: r.text.length })));
   
   // Step 2: Extract ingredients for all recipes in one call
   console.log(`🥕 [processBatchRecipes] Step 2: Batch extracting ingredients...`);
   const batchIngredients = await batchExtractIngredients(recipeTexts, requirements);
   console.log(`✅ [processBatchRecipes] Batch ingredients extracted successfully`);

   // Step 3: Search Weaviate for candidates for all ingredients
   console.log(`🔍 [processBatchRecipes] Step 3: Searching for product candidates...`);
   const recipesWithCandidates = await Promise.all(
      batchIngredients.recipes.map(async (recipe, idx) => {
         console.log(`🔍 [processBatchRecipes] Searching candidates for recipe ${idx + 1}/${batchIngredients.recipes.length}: ${recipe.recipe_title}`);
         const candidates = await searchCandidatesForIngredients(
            recipe.ingredients,
            { fields, limit }
         );
         
         console.log(`✅ [processBatchRecipes] Found ${Array.isArray(candidates) ? candidates.length : 'N/A'} candidates for ${recipe.recipe_title}`);
         
         return {
            index: recipe.recipe_index,
            title: recipe.recipe_title,
            recipe: recipeTexts[recipe.recipe_index].text,
            ingredients: recipe.ingredients,
            candidates: candidates || {}, // Ensure it's always a Record
         };
      })
   );

   console.log(`✅ [processBatchRecipes] All candidate searches completed`);
   
   // Step 4: Select products for all recipes in one call
   console.log(`🛒 [processBatchRecipes] Step 4: Batch selecting products...`);
   const batchSelections = await batchSelectProducts(
      recipesWithCandidates,
      requirements
   );
   console.log(`✅ [processBatchRecipes] Batch product selections completed`);

   // Step 5: Combine results
   console.log(`🔗 [processBatchRecipes] Step 5: Combining results...`);
   const results = generatedRecipes.map((generated, idx) => {
      const ingredients = batchIngredients.recipes.find(
         (r) => r.recipe_index === idx
      )?.ingredients;
      const selection = batchSelections.selections.find(
         (s) => s.recipe_index === idx
      );
      const candidatesForRecipe = recipesWithCandidates.find(
         (r) => r.index === idx
      )?.candidates;

      console.log(`🔗 [processBatchRecipes] Processing result ${idx + 1}/${generatedRecipes.length}: ${generated.title}`);
      console.log(`🔗 [processBatchRecipes] - Ingredients found: ${ingredients ? ingredients.length : 0}`);
      console.log(`🔗 [processBatchRecipes] - Candidates found: ${candidatesForRecipe ? (Array.isArray(candidatesForRecipe) ? candidatesForRecipe.length : 'object') : 0}`);
      console.log(`🔗 [processBatchRecipes] - Shopping list items: ${selection?.shopping_list?.length || 0}`);
      
      return {
         ok: true as const,
         title: generated.title,
         generated,
         plan: {
            ingredients: ingredients || [],
            candidates: candidatesForRecipe || {}, // Ensure it's always a Record
            shopping_list: selection?.shopping_list || [],
         },
      };
   });
   
   console.log(`✅ [processBatchRecipes] Batch processing completed successfully`);
   console.log(`📊 [processBatchRecipes] Final results summary:`, {
      total: results.length,
      successful: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length
   });
   
   return results;
}