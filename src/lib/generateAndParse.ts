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
   prep_time_minutes: z.number().min(1).max(120),
   cook_time_minutes: z.number().min(1).max(240),
   total_time_minutes: z.number().min(1).max(360),
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

export async function generateRecipes({
   requirements,
   prompt,
   fields,
   limit = 6,
}: BatchPlanInput): Promise<GeneratedRecipe[]> {
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
               `Generate ${limit} diverse, practical recipes. Each must include:
               - A concise ingredient list with realistic quantities
               - Step-by-step cooking instructions
               - Accurate timing information: prep_time_minutes (active preparation), cook_time_minutes (cooking/baking), and total_time_minutes (prep + cook)
               - Realistic serving sizes
               
               Focus on achievable recipes with accurate timing based on the actual cooking methods used. Respond in strict JSON format.`,
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

   const parsed = gen.choices[0].message?.parsed
   if (!parsed) {
      console.log(`❌ [generateAndPlanRecipes] Failed to parse OpenAI response`);
      throw new Error("Failed to generate recipes");
   }
   return parsed.recipes
}
