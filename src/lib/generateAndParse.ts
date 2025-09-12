// src/lib/generateAndPlanRecipes.ts
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { planRecipe } from "./parse-recipe-ai";

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
   /** hard-require; used in both the selection step and to guide generation (style, budget, stores, dietary, etc.) */
   requirements: string;
   /** optional guidance to steer themes/cuisines/time/macros/etc. */
   prompt?: string;
   /** extra fields to request from Weaviate */
   fields?: string[];
   /** Weaviate candidate limit per ingredient */
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
   // 1) Generate 6 recipes in strict JSON
   const gen = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
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

   // 2) For each generated recipe, compose a compact “recipe text” and run planRecipe
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
            recipe: recipeText, // reuse your existing “mine parse recipe”/plan pipeline
            requirements, // same requirements passed through
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

   // 3) Normalize fulfilled/rejected into a single array
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
