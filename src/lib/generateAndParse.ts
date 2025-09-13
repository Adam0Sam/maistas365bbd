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
   recipes: z.array(GeneratedRecipeSchema).length(6),
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
   limit,
}: BatchPlanInput): Promise<PlannedRecipeResult[]> {
   // 1) Generate 6 recipes in strict JSON (1 API call)
   const gen = await openai.chat.completions.parse({
      model: "gpt-5-mini-2025-08-07",
      messages: [
         {
            role: "system",
            content:
               "Generate 6 diverse, practical recipes. Each must include a concise ingredient list with quantities and step-by-step instructions. Respond in strict JSON.",
         },
         {
            role: "user",
            content: JSON.stringify({
               requirements, // e.g. stores, budget, dietary filters
               prompt:
                  prompt ??
                  "Weeknight-friendly, ~30–45 min, balanced nutrition.",
               count: 6,
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
   if (!parsed) throw new Error("Failed to generate recipes");

   // 2) Process all recipes in batch (only 2 more API calls total instead of 12)
   try {
      const batchResults = await processBatchRecipes(
         parsed.recipes,
         requirements,
         fields,
         limit
      );
      
      return batchResults;
   } catch (error) {
      console.error("Batch processing failed, falling back to individual processing:", error);
      
      // Fallback to individual processing if batch fails
      const results = await Promise.allSettled(
         parsed.recipes.map(async (r) => {
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

            const plan = await planRecipe({
               recipe: recipeText,
               requirements,
               fields,
               limit,
            });

            return {
               ok: true as const,
               title: r.title,
               generated: r,
               plan,
            };
         })
      );

      // Normalize fulfilled/rejected into a single array
      const normalized: PlannedRecipeResult[] = results.map((res, idx) => {
         const g = parsed.recipes[idx];
         if (res.status === "fulfilled") return res.value;
         return {
            ok: false,
            title: g.title,
            generated: g,
            error: res.reason?.message ?? "Unknown error",
         };
      });

      return normalized;
   }
}
