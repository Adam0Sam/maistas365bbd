// src/lib/generateAndPlanRecipes.ts
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { planRecipe } from "./parse-recipe-ai";
import { processBatchRecipes } from "./batch-recipe-processor";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Schemas for generation ---
const GeneratedIngredientSchema = z.object({
   name: z.string(),
   quantity: z.string(),
});
const GeneratedRecipeSchema = z.object({
   title: z.string(),
   description: z.string(),
   servings: z.number(),
   ingredients: z.array(GeneratedIngredientSchema).min(3),
   instructions: z.array(z.string()).min(2),
});
const GeneratedRecipesResponseSchema = z.object({
   recipes: z.array(GeneratedRecipeSchema).min(1).max(12),
});
export type GeneratedRecipe = z.infer<typeof GeneratedRecipeSchema>;
export type GeneratedRecipesResponse = z.infer<
   typeof GeneratedRecipesResponseSchema
>;

export type BatchPlanInput = {
   requirements: string;
   prompt?: string;
   fields?: string[];
   limit?: number;
};

export type PlannedRecipeResult =
   | {
        ok: true;
        title: string;
        generated: GeneratedRecipe;
        plan: Awaited<ReturnType<typeof planRecipe>>;
     }
   | {
        ok: false;
        title: string;
        generated: GeneratedRecipe;
        error: string;
     };

export async function generateAndPlanRecipes({
   requirements,
   prompt,
   fields,
   limit = 6,
}: BatchPlanInput): Promise<PlannedRecipeResult[]> {
   console.log(`🍳 [generateAndPlanRecipes] Starting with parameters:`);
   console.log(`🍳 [generateAndPlanRecipes] - requirements: ${requirements}`);
   console.log(`🍳 [generateAndPlanRecipes] - prompt: ${prompt}`);
   console.log(`🍳 [generateAndPlanRecipes] - fields: ${JSON.stringify(fields)}`);
   console.log(`🍳 [generateAndPlanRecipes] - limit: ${limit}`);
   
   // 1) Generate recipes in strict JSON (1 API call)
   console.log(`🤖 [generateAndPlanRecipes] Calling OpenAI to generate ${limit} recipes...`);
   const gen = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
         {
            role: "system",
            content:
               `Generate ${limit} diverse, practical recipes. Each must include a concise ingredient list with quantities and step-by-step instructions. Respond in strict JSON.`,
         },
         {
            role: "user",
            content: JSON.stringify({
               requirements, // e.g. stores, budget, dietary filters
               prompt:
                  prompt ??
                  "Weeknight-friendly, ~30–45 min, balanced nutrition.",
               count: limit,
            }),
         },
      ],
      response_format: zodResponseFormat(
         GeneratedRecipesResponseSchema,
         "recipes"
      ),
   });

   const parsed = gen.choices[0].message?.parsed as
      | GeneratedRecipesResponse
      | undefined;
   console.log(`🤖 [generateAndPlanRecipes] OpenAI response received`);
   console.log(`🤖 [generateAndPlanRecipes] Raw OpenAI response:`, JSON.stringify(gen, null, 2));
   
   if (!parsed) {
      console.log(`❌ [generateAndPlanRecipes] Failed to parse OpenAI response`);
      throw new Error("Failed to generate recipes");
   }
   
   console.log(`✅ [generateAndPlanRecipes] Successfully parsed ${parsed.recipes.length} recipes`);
   console.log(`🍳 [generateAndPlanRecipes] Generated recipes:`, parsed.recipes.map(r => ({ title: r.title, ingredients: r.ingredients.length })));

   // 2) Process all recipes in batch (only 2 more API calls total instead of 12)
   console.log(`📦 [generateAndPlanRecipes] Starting batch processing...`);
   try {
      console.log(`📦 [generateAndPlanRecipes] Calling processBatchRecipes with ${parsed.recipes.length} recipes`);
      const batchResults = await processBatchRecipes(
         parsed.recipes,
         requirements,
         fields,
         limit
      );
      
      console.log(`✅ [generateAndPlanRecipes] Batch processing completed successfully`);
      console.log(`📦 [generateAndPlanRecipes] Batch results summary:`, {
         total: batchResults.length,
         successful: batchResults.filter(r => r.ok).length,
         failed: batchResults.filter(r => !r.ok).length
      });
      
      return batchResults;
   } catch (error) {
      console.error("❌ [generateAndPlanRecipes] Batch processing failed, falling back to individual processing:", error);
      
      // Fallback to individual processing if batch fails
      console.log(`🔄 [generateAndPlanRecipes] Starting fallback individual processing for ${parsed.recipes.length} recipes`);
      const results = await Promise.allSettled(
         parsed.recipes.map(async (r, index) => {
            console.log(`🔄 [generateAndPlanRecipes] Processing individual recipe ${index + 1}/${parsed.recipes.length}: ${r.title}`);
            const recipeText =
               `Title: ${r.title}\n` +
               (r.description ? `Description: ${r.description}\n` : "") +
               (typeof r.servings === "number"
                  ? `Servings: ${r.servings}\n`
                  : "") +
               `Ingredients:\n` +
               r.ingredients
                  .map((i) => `- ${i.quantity ?? ""} ${i.name}`.trim())
                  .join("\n") +
               `\nInstructions:\n` +
               r.instructions.map((step, idx) => `${idx + 1}. ${step}`).join("\n");

            console.log(`📝 [generateAndPlanRecipes] Calling planRecipe for: ${r.title}`);
            const plan = await planRecipe({
               recipe: recipeText,
               requirements,
               fields,
               limit,
            });
            
            console.log(`✅ [generateAndPlanRecipes] Successfully planned recipe: ${r.title}`);
            return {
               ok: true as const,
               title: r.title,
               generated: r,
               plan,
            };
         })
      );

      // Normalize fulfilled/rejected into a single array
      console.log(`🔄 [generateAndPlanRecipes] Processing ${results.length} individual results...`);
      const normalized: PlannedRecipeResult[] = results.map((res, idx) => {
         const g = parsed.recipes[idx];
         if (res.status === "fulfilled") {
            console.log(`✅ [generateAndPlanRecipes] Recipe ${idx + 1} (${g.title}) processed successfully`);
            return res.value;
         }
         console.log(`❌ [generateAndPlanRecipes] Recipe ${idx + 1} (${g.title}) failed:`, res.reason?.message);
         return {
            ok: false,
            title: g.title,
            generated: g,
            error: res.reason?.message ?? "Unknown error",
         };
      });
      
      console.log(`🔄 [generateAndPlanRecipes] Fallback processing complete:`, {
         total: normalized.length,
         successful: normalized.filter(r => r.ok).length,
         failed: normalized.filter(r => !r.ok).length
      });

      return normalized;
   }
}
