// src/lib/parse-full-recipe-ai.ts
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** ---- Schemas ---- */
export const IngredientOutSchema = z.object({
   name: z.string().min(1),
   quantity: z.string().min(1),
   unit: z.string(),
   quantity_value: z.number().positive(),
   core: z.boolean(),
});

export const StepOutSchema = z.object({
   instruction: z.string().min(1),
   number: z.number(),
});

export const RecipeInfoSchema = z.object({
   title: z.string().min(1),
   description: z.string(),
   servings: z.number().int().positive(), // ← will be set to target_servings
   prep_minutes: z.number().int().nonnegative(),
   cook_minutes: z.number().int().nonnegative(),
   total_minutes: z.number().int(),
   difficulty: z.enum(["easy", "medium", "hard"]),
});

export const ParsedRecipeSchema = z.object({
   info: RecipeInfoSchema,
   ingredients: z.array(IngredientOutSchema).min(1),
   steps: z.array(StepOutSchema).min(1),
});
export type ParsedRecipe = z.infer<typeof ParsedRecipeSchema>;

export const ParseFullRecipeBodySchema = z.object({
   recipe: z.string(),
   requirements: z.string().optional(),
   /** new: ask AI to scale quantities to this servings count */
   target_servings: z.number().int().positive().optional(),
});
export type ParseFullRecipeBody = z.infer<typeof ParseFullRecipeBodySchema>;

export async function parseFullRecipeAI(input: ParseFullRecipeBody) {
   const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
         role: "system",
         content: [
            "You extract the user's recipe into a structured schema.",
            "Classify ingredients into { core: true/false }. Core = fundamentally required to make the dish.",
            "Quantities must be accurate and human-readable in `quantity`. Normalize into `quantity_value` and `unit` when possible.",
            "If the user provides `target_servings`, SCALE ALL ingredient quantities to that servings and set info.servings = target_servings.",
            "If the recipe’s baseline servings are missing, infer a conservative baseline and scale proportionally.",
            "Do not invent new ingredients or steps; only scale amounts.",
            "Return strict JSON matching the provided schema.",
         ].join(" "),
      },
      {
         role: "user",
         content: JSON.stringify({
            recipe: input.recipe,
            requirements: input.requirements ?? null,
            target_servings: input.target_servings ?? null,
         }),
      },
   ];

   const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages,
      response_format: zodResponseFormat(ParsedRecipeSchema, "parsed_recipe"),
   });

   const parsed = completion.choices[0].message?.parsed as
      | ParsedRecipe
      | undefined;
   if (!parsed) throw new Error("AI did not return a valid parsed recipe.");

   const info = { ...parsed.info };
   if (
      info.total_minutes == null &&
      typeof info.prep_minutes === "number" &&
      typeof info.cook_minutes === "number"
   ) {
      info.total_minutes = info.prep_minutes + info.cook_minutes;
   }

   const steps = parsed.steps
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((s, i) => ({ ...s, number: i + 1 }));

   return { ...parsed, info, steps } satisfies ParsedRecipe;
}
// --- keep your existing imports, schemas, ParseFullRecipeBodySchema, ParsedRecipe, and parseFullRecipeAI as-is above ---

/** ────────────────────────────────────────────────────────────────────────────
 * Minimal annotation schema (hybrid approach)
 * The model only labels which artifact (track) a simple step belongs to,
 * and which artifacts a join step depends on. We assemble the DAG in code.
 * ──────────────────────────────────────────────────────────────────────────── */

export const ArtifactSchema = z.object({
   id: z.string().min(1), // slug-like id e.g. "sauce"
   title: z.string().min(1), // human label e.g. "Sauce"
   emoji: z.string(), // optional, purely cosmetic
});

export const AnnotatedSimpleStepSchema = z.object({
   step_id: z.string().min(1),
   number: z.number().int().positive(),
   instruction: z.string().min(1),
   role: z.literal("simple"),
   primary_artifact_id: z.string().min(1),
   duration_minutes: z.number().int().positive().nullable(),
   depends_on_steps: z.array(z.string().min(1)).nullable(),
});

export const AnnotatedJoinStepSchema = z.object({
   step_id: z.string().min(1),
   number: z.number().int().positive(),
   instruction: z.string().min(1),
   role: z.literal("join"),
   depends_on_artifacts: z.array(z.string().min(1)).min(2),
});

export const AnnotatedStepSchema = z.union([
   AnnotatedSimpleStepSchema,
   AnnotatedJoinStepSchema,
]);

/** AI response that includes your original parsed recipe PLUS the minimal annotations */
export const AnnotatedRecipeResponseSchema = z.object({
   info: RecipeInfoSchema,
   ingredients: z.array(IngredientOutSchema).min(1),
   // legacy flat steps for backward compat (we still return them)
   steps: z.array(StepOutSchema).min(1),

   // minimal annotation payload
   artifacts: z.array(ArtifactSchema).min(1),
   annotated_steps: z.array(AnnotatedStepSchema).min(1),
});

export type Artifact = z.infer<typeof ArtifactSchema>;
export type AnnotatedSimpleStep = z.infer<typeof AnnotatedSimpleStepSchema>;
export type AnnotatedJoinStep = z.infer<typeof AnnotatedJoinStepSchema>;
export type AnnotatedRecipeResponse = z.infer<
   typeof AnnotatedRecipeResponseSchema
>;

/** UI graph types you can feed directly to the Steps screen */
export type GraphSimpleStep = {
   step_id: string;
   number: number;
   instruction: string;
   duration_minutes?: number;
   depends_on_steps?: string[]; // step_ids from other tracks that must be completed first
};

export type GraphTrack = {
   track_id: string;
   title: string;
   emoji?: string;
   steps: GraphSimpleStep[]; // only SIMPLE steps live here
};

export type GraphJoin = {
   step_id: string;
   title: string;
   instruction: string;
   depends_on: string[]; // track_ids
};

export type StepGraph = {
   tracks: GraphTrack[];
   joins: GraphJoin[];
   /** optional warnings from validation */
   warnings?: string[];
};

/** Build a deterministic graph from minimal annotations with validation & fallbacks */
export function buildStepGraph(
   artifacts: Artifact[],
   annotated: (AnnotatedSimpleStep | AnnotatedJoinStep)[]
): StepGraph {
   const warnings: string[] = [];
   const artMap = new Map(artifacts.map((a) => [a.id, a]));

   // group simple steps by artifact
   const trackSteps = new Map<string, GraphSimpleStep[]>();
   for (const a of artifacts) trackSteps.set(a.id, []);

   const joins: GraphJoin[] = [];

   for (const st of annotated) {
      if (st.role === "simple") {
         if (!artMap.has(st.primary_artifact_id)) {
            warnings.push(
               `Unknown artifact "${st.primary_artifact_id}" for step "${st.step_id}".`
            );
            continue;
         }
         const arr = trackSteps.get(st.primary_artifact_id)!;
         arr.push({
            step_id: st.step_id,
            number: st.number,
            instruction: st.instruction,
            duration_minutes: st.duration_minutes || undefined,
            depends_on_steps: st.depends_on_steps || undefined,
         });
      } else {
         // join step
         const unknown = st.depends_on_artifacts.filter(
            (id) => !artMap.has(id)
         );
         if (unknown.length) {
            warnings.push(
               `Join step "${
                  st.step_id
               }" depends on unknown artifacts: ${unknown.join(", ")}.`
            );
            // drop bad dependencies
         }
         const deps = st.depends_on_artifacts.filter((id) => artMap.has(id));
         if (deps.length >= 2) {
            joins.push({
               step_id: st.step_id,
               title: st.instruction.split(".")[0] || "Combine",
               instruction: st.instruction,
               depends_on: deps,
            });
         } else {
            warnings.push(
               `Join step "${st.step_id}" has fewer than 2 valid dependencies; skipped.`
            );
         }
      }
   }

   // sort steps inside each track by number and normalize numbering per track
   const tracks: GraphTrack[] = artifacts
      .map((a) => {
         const steps = (trackSteps.get(a.id) ?? [])
            .slice()
            .sort((x, y) => x.number - y.number)
            .map((s, i) => ({ ...s, number: i + 1 }));
         return { track_id: a.id, title: a.title, emoji: a.emoji, steps };
      })
      // keep only tracks that actually have steps
      .filter((t) => t.steps.length > 0);

   // Fallback: if no valid tracks, produce a single "main" track from all simple annotated steps
   if (tracks.length === 0) {
      const simples = annotated.filter(
         (s) => s.role === "simple"
      ) as AnnotatedSimpleStep[];
      if (simples.length === 0) {
         return {
            tracks: [],
            joins: [],
            warnings: [...warnings, "No simple steps found in annotations."],
         };
      }
      const fallback: GraphTrack = {
         track_id: "main",
         title: "Main",
         steps: simples
            .slice()
            .sort((a, b) => a.number - b.number)
            .map((s, i) => ({
               step_id: s.step_id,
               number: i + 1,
               instruction: s.instruction,
               duration_minutes: s.duration_minutes || undefined,
               depends_on_steps: s.depends_on_steps || undefined,
            })),
      };
      return {
         tracks: [fallback],
         joins: [],
         warnings: [...warnings, "Using fallback single track."],
      };
   }

   return { tracks, joins, warnings };
}

/** Ask the model for minimal annotations + your regular parsed recipe in one go */
export async function parseRecipeAnnotatedAI(input: ParseFullRecipeBody) {
   const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
         role: "system",
         content: [
            "You will structure a recipe faithfully while breaking it down into HIGHLY GRANULAR parallel tracks.",
            "Return the standard parsed fields (info, ingredients, steps) with DETAILED steps.",
            "",
            "STEP GRANULARITY REQUIREMENTS - SINGLE RESPONSIBILITY:",
            "- MANDATORY: Each step performs exactly ONE action or process",
            "- Break compound actions: 'Heat oil and add onions' → 'Heat oil to shimmering' + 'Add diced onions to hot oil'",
            "- Separate prep from execution: 'Prepare and cook pasta' → 'Fill large pot with water' + 'Salt water generously' + 'Bring to rolling boil' + 'Add pasta' + 'Cook 8-10 minutes until al dente'",
            "- Make implicit steps explicit: 'Add garlic' → 'Remove pan from heat' + 'Add minced garlic' + 'Stir 30 seconds until fragrant'",
            "- Isolate waiting periods: 'Let rest 5 minutes' as separate step with exact duration_minutes",
            "- Split temperature changes: 'Reduce heat and simmer' → 'Reduce heat to low' + 'Simmer uncovered 15 minutes'",
            "",
            "EXACT TIMING REQUIREMENTS - NO APPROXIMATIONS:",
            "- MANDATORY duration_minutes for ALL time-sensitive steps (heating, cooking, resting, marinating)",
            "- Use specific ranges when appropriate: 'Sauté 3-4 minutes' = duration_minutes: 4",
            "- Convert vague timing: 'until golden' → 'Sauté 5-7 minutes until golden brown' with duration_minutes: 7",
            "- Include setup timing: 'Preheat oven' with duration_minutes: 15",
            "- Account for cooling/resting: 'Cool completely' with duration_minutes: 30",
            "- No 'until done' - specify actual time: 'Bake until set' → 'Bake 25 minutes until center is just set'",
            "",
            "MULTI-TRACK MANDATE - MAXIMUM PARALLELIZATION REQUIRED:",
            "- ABSOLUTE REQUIREMENT: Create minimum 4-7 artifacts for ANY recipe with >5 steps",
            "- FORBIDDEN: Single-track solutions except for recipes with <4 total steps",
            "- FORBIDDEN: Using generic 'main' track - be specific about what each track produces",
            "- Think like a Michelin-starred kitchen: every cook has a dedicated station and timeline",
            "- MANDATORY track categories (use as many as applicable):",
            "  * Protein track: marinating, seasoning, cooking protein separately",
            "  * Starch track: pasta/rice/potatoes with their own prep and cooking timeline",
            "  * Vegetable_prep track: all chopping, dicing, slicing operations",
            "  * Vegetable_cooking track: separate from prep, focused on cooking methods",
            "  * Aromatics track: onions, garlic, ginger, herbs - prep and cooking",
            "  * Sauce_base track: building sauce foundations, reductions",
            "  * Sauce_finishing track: final sauce assembly and seasoning",
            "  * Equipment_prep track: heating pans, preheating ovens, tool setup",
            "  * Garnish track: final touches, plating components",
            "- AGGRESSIVE SPLITTING: If a track has >4 steps, split it further",
            "- Example splits: 'vegetables' → 'onion_prep' + 'other_veg_prep' + 'saute_aromatics' + 'finish_vegetables'",
            "- CREATE WORK DURING WAIT TIMES: Every cooking/waiting step should enable other track work",
            "- Equipment-based parallelization: oven_primary, oven_secondary, stovetop_1, stovetop_2, stovetop_3, prep_station_1, prep_station_2",
            "- Time-based splitting: early_prep (30min before), active_cooking (main phase), finishing (final 10min)",
            "",
            "DEPENDENCY MAPPING - EXPLICIT SEQUENCING:",
            "- Use depends_on_steps for precise cross-track dependencies",
            "- Example: 'Add cooked onions to sauce' depends_on_steps: ['onion_track_step_3']",
            "- Map equipment sharing: second stovetop dish waits for first pan to finish",
            "- Temperature dependencies: 'Add to hot pan' depends on 'Heat pan 3 minutes'",
            "",
            "QUALITY CONTROLS - ENFORCE MAXIMUM PARALLELIZATION:",
            "- AUTOMATIC REJECTION: Any solution with <3 tracks unless recipe has <4 total steps",
            "- AUTOMATIC REJECTION: Any track with >5 steps (must be split further)",
            "- AUTOMATIC REJECTION: Generic track names like 'main', 'cooking', 'prep' without specificity",
            "- VALIDATION: Every recipe >10 steps must have minimum 5 distinct tracks",
            "- VALIDATION: At least 60% of cooking time must have parallel track activity",
            "- Every step must specify WHO does WHAT for HOW LONG",
            "- No compound verbs in instructions: use single action verbs",
            "- All referenced step_ids and artifact_ids must exist",
            "- Timing should enable optimal workflow with ZERO idle time across all tracks",
            "- PERFORMANCE TARGET: Total recipe time should be 40-60% of sequential execution",
            "",
            "EXAMPLES OF GOOD GRANULARITY:",
            "Bad: 'Prepare vegetables and sauté with seasonings until tender'",
            "Good: Track 'vegetable_prep': 'Dice onions into ¼-inch pieces' + 'Mince 3 garlic cloves' + 'Slice bell peppers into strips'",
            "     Track 'vegetable_cooking': 'Heat 2 tbsp oil in large skillet' + 'Add diced onions, cook 3 minutes until translucent' + 'Add garlic, stir 30 seconds until fragrant'",
            "",
            "Respond in strict JSON.",
         ].join(" "),
      },
      {
         role: "user",
         content: JSON.stringify({
            recipe: input.recipe,
            requirements: input.requirements ?? null,
            target_servings: input.target_servings ?? null,
         }),
      },
   ];

   const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages,
      response_format: zodResponseFormat(
         AnnotatedRecipeResponseSchema,
         "annotated_recipe"
      ),
   });

   const parsed = completion.choices[0].message?.parsed as
      | AnnotatedRecipeResponse
      | undefined;
   if (!parsed) throw new Error("AI did not return annotated recipe.");

   // normalize legacy fields exactly like your original function
   const info = { ...parsed.info };
   if (
      info.total_minutes == null &&
      typeof info.prep_minutes === "number" &&
      typeof info.cook_minutes === "number"
   ) {
      info.total_minutes = info.prep_minutes + info.cook_minutes;
   }
   const steps = parsed.steps
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((s, i) => ({ ...s, number: i + 1 }));

   const recipe: ParsedRecipe = {
      info,
      ingredients: parsed.ingredients,
      steps,
   };

   // Build the UI graph deterministically from annotations
   const graph = buildStepGraph(parsed.artifacts, parsed.annotated_steps);

   return {
      recipe, // your legacy shape (for anything already wired)
      annotations: {
         artifacts: parsed.artifacts,
         annotated_steps: parsed.annotated_steps,
      },
      graph, // tracks + joins for the parallel/dependent step UI
   };
}
