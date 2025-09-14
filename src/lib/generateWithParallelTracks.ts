import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { 
  ArtifactSchema, 
  AnnotatedStepSchema, 
  buildStepGraph,
  type Artifact,
  type AnnotatedSimpleStep,
  type AnnotatedJoinStep,
  type StepGraph
} from "./parse-full-recipe";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Enhanced recipe schema with parallel track annotations
const EnhancedIngredientSchema = z.object({
  name: z.string(),
  quantity: z.string(),
});

const EnhancedRecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  servings: z.number(),
  prep_time_minutes: z.number().min(1).max(120),
  cook_time_minutes: z.number().min(1).max(240),
  total_time_minutes: z.number().min(1).max(360),
  ingredients: z.array(EnhancedIngredientSchema).min(3),
  instructions: z.array(z.string()).min(2),
  // Parallel track annotations
  artifacts: z.array(ArtifactSchema).min(1),
  annotated_steps: z.array(AnnotatedStepSchema).min(1),
});

const EnhancedRecipesResponseSchema = z.object({
  recipes: z.array(EnhancedRecipeSchema).min(1).max(12),
});

export type EnhancedRecipe = z.infer<typeof EnhancedRecipeSchema>;
export type EnhancedRecipesResponse = z.infer<typeof EnhancedRecipesResponseSchema>;

export type RecipeWithGraph = {
  title: string;
  description: string;
  servings: number;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  ingredients: Array<{ name: string; quantity: string }>;
  instructions: string[];
  graph: StepGraph;
};

export async function generateRecipesWithParallelTracks({
  requirements,
  prompt,
  limit = 6,
}: {
  requirements: string;
  prompt?: string;
  limit?: number;
}): Promise<RecipeWithGraph[]> {
  console.log(`🍳 [generateWithParallelTracks] Starting generation with parallel tracks`);
  console.log(`🍳 [generateWithParallelTracks] - requirements: ${requirements}`);
  console.log(`🍳 [generateWithParallelTracks] - prompt: ${prompt}`);
  console.log(`🍳 [generateWithParallelTracks] - limit: ${limit}`);

  const systemPrompt = `Generate ${limit} diverse, practical recipes with ULTRA-GRANULAR parallel cooking tracks. Each step must have SINGLE RESPONSIBILITY ONLY.

CRITICAL RULE: ONE ACTION PER STEP
Each step must describe exactly ONE specific action. Never combine multiple actions in a single step.

1. Basic recipe information:
   - Title, description, servings
   - Accurate timing: prep_time_minutes, cook_time_minutes, total_time_minutes
   - Ingredient list with quantities
   - ULTRA-GRANULAR single-responsibility step-by-step instructions

2. Parallel track annotations for efficient cooking:
   - artifacts: Identify ALL distinct parallel preparations:
     * Equipment-specific: "oven_prep", "stovetop_1", "stovetop_2", "prep_station", "mixing_station"
     * Component-specific: "protein", "starch", "vegetables", "sauce", "aromatics", "marinade", "garnish"
     * Process-specific: "cleaning", "seasoning", "marinating", "resting", "plating"

3. SINGLE RESPONSIBILITY STEP BREAKDOWN:
   Each step must contain ONLY ONE of these action types:
   - Physical prep: "Wash carrots", "Peel onions", "Dice garlic into small pieces"
   - Equipment setup: "Turn oven to 425°F", "Place large pan on stovetop", "Heat pan over medium heat"
   - Adding ingredients: "Add salt to water", "Pour oil into pan", "Place chicken in pan"
   - Timing actions: "Cook for 3 minutes", "Let rest for 5 minutes", "Marinate for 15 minutes"
   - Temperature checks: "Check internal temperature reaches 165°F"
   - Movement actions: "Flip chicken", "Stir vegetables", "Remove from heat"

WRONG (Multiple responsibilities):
❌ "Heat oil in pan and add onions" (heating + adding)
❌ "Dice onions and garlic" (two prep actions)
❌ "Season chicken and place in pan" (seasoning + placement)
❌ "Cook pasta according to package directions" (vague, multiple actions)

CORRECT (Single responsibility):
✅ "Heat large skillet over medium-high heat" (2 min, stovetop_1)
✅ "Add 2 tablespoons oil to heated skillet" (30 sec, stovetop_1)
✅ "Add diced onions to hot oil" (30 sec, stovetop_1)
✅ "Dice 1 medium onion into ¼-inch pieces" (3 min, prep_station)
✅ "Mince 3 garlic cloves finely" (2 min, prep_station)
✅ "Season both sides of chicken with salt" (1 min, prep_station)
✅ "Season both sides of chicken with black pepper" (1 min, prep_station)
✅ "Place seasoned chicken in hot pan" (30 sec, stovetop_1)
✅ "Cook chicken undisturbed for 6 minutes" (6 min, stovetop_1)
✅ "Flip chicken to other side" (30 sec, stovetop_1)
✅ "Cook second side for 5 minutes" (5 min, stovetop_1)

EXTREME GRANULARITY EXAMPLES:
Instead of: "Prepare pasta water"
Break into:
1. "Fill large pot with 4 quarts water" (1 min, prep_station)
2. "Add 2 tablespoons salt to water" (30 sec, prep_station)
3. "Place pot on stovetop burner" (30 sec, stovetop_2)
4. "Turn heat to high under pot" (30 sec, stovetop_2)
5. "Wait for water to reach rolling boil" (8 min, stovetop_2)

Instead of: "Make the sauce"
Break into:
1. "Heat small saucepan over medium heat" (2 min, stovetop_3)
2. "Add 2 tablespoons butter to heated pan" (30 sec, stovetop_3)
3. "Let butter melt completely" (1 min, stovetop_3)
4. "Add 2 tablespoons flour to melted butter" (30 sec, stovetop_3)
5. "Whisk flour and butter together" (1 min, stovetop_3)
6. "Cook flour mixture for 2 minutes while stirring" (2 min, stovetop_3)
7. "Slowly add ½ cup milk while whisking" (1 min, stovetop_3)
8. "Continue whisking until smooth" (1 min, stovetop_3)
9. "Simmer sauce for 3 minutes until thickened" (3 min, stovetop_3)

TIMING REQUIREMENTS:
- Every step involving heat, cooking, waiting, or marinating gets duration_minutes
- Steps should be 30 seconds to 10 minutes maximum
- If something takes longer, break into multiple steps with checkpoints

ARTIFACT STRATEGY:
Create separate tracks for truly parallel work:
- {id: "water_prep", title: "Boiling Water", emoji: "💧"}
- {id: "protein_prep", title: "Protein Preparation", emoji: "🥩"}
- {id: "vegetable_prep", title: "Vegetable Prep", emoji: "🥕"}
- {id: "sauce_making", title: "Sauce Creation", emoji: "🥄"}
- {id: "oven_cooking", title: "Oven Cooking", emoji: "🔥"}
- {id: "garnish_prep", title: "Final Garnish", emoji: "🌿"}

Remember: If you can describe two different actions in one step, it should be two separate steps!`;

  try {
    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            requirements,
            prompt: prompt ?? "Weeknight-friendly recipes with parallel cooking steps for efficiency",
            count: limit,
          }),
        },
      ],
      response_format: zodResponseFormat(EnhancedRecipesResponseSchema, "enhanced_recipes"),
    });

    const parsed = completion.choices[0].message?.parsed;
    if (!parsed) {
      console.error(`❌ [generateWithParallelTracks] Failed to parse OpenAI response`);
      throw new Error("Failed to generate recipes with parallel tracks");
    }

    // Transform each recipe with its graph
    const recipesWithGraphs: RecipeWithGraph[] = parsed.recipes.map(recipe => {
      // Build the step graph from annotations
      const graph = buildStepGraph(recipe.artifacts, recipe.annotated_steps);
      
      console.log(`📊 [generateWithParallelTracks] Generated graph for "${recipe.title}":`, {
        tracks: graph.tracks.length,
        trackDetails: graph.tracks.map(t => `${t.title} (${t.steps.length} steps)`),
        joins: graph.joins.length,
      });

      return {
        title: recipe.title,
        description: recipe.description,
        servings: recipe.servings,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        total_time_minutes: recipe.total_time_minutes,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        graph,
      };
    });

    console.log(`✅ [generateWithParallelTracks] Successfully generated ${recipesWithGraphs.length} recipes with parallel tracks`);
    return recipesWithGraphs;
  } catch (error) {
    console.error(`❌ [generateWithParallelTracks] Error generating recipes:`, error);
    throw error;
  }
}

/**
 * Parse existing recipe into parallel tracks
 */
export async function parseExistingRecipeIntoTracks(
  recipe: {
    title: string;
    instructions: string[];
    ingredients?: Array<{ name: string; quantity: string }>;
  }
): Promise<StepGraph> {
  console.log(`🔄 [parseExistingRecipeIntoTracks] Parsing recipe: ${recipe.title}`);

  const recipeText = `
Title: ${recipe.title}

Ingredients:
${recipe.ingredients?.map(ing => `- ${ing.quantity} ${ing.name}`).join('\n') || 'Not provided'}

Instructions:
${recipe.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}
`;

  try {
    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analyze this recipe and break it down into ULTRA-GRANULAR parallel cooking tracks. Each step must have SINGLE RESPONSIBILITY.

CRITICAL RULE: ONE ACTION PER STEP
Each step must describe exactly ONE specific action. Never combine multiple actions in a single step.

SINGLE RESPONSIBILITY REQUIREMENTS:
1. Each step contains ONLY ONE action type:
   - Physical prep: "Wash carrots", "Peel onions", "Dice garlic into small pieces"
   - Equipment setup: "Turn oven to 425°F", "Place large pan on stovetop"
   - Adding ingredients: "Add salt to water", "Pour oil into pan"
   - Timing actions: "Cook for 3 minutes", "Let rest for 5 minutes"
   - Temperature checks: "Check internal temperature reaches 165°F"
   - Movement actions: "Flip chicken", "Stir vegetables"

2. Break compound actions into individual steps:
   - Instead of "Heat oil and add onions" → "Heat oil in pan" + "Add onions to hot oil"
   - Instead of "Dice onions and garlic" → "Dice onions" + "Dice garlic"
   - Instead of "Season and cook chicken" → "Season chicken" + "Cook chicken"

WRONG (Multiple responsibilities):
❌ "Heat oil in pan and add onions"
❌ "Dice onions and garlic" 
❌ "Season chicken and place in pan"
❌ "Cook pasta according to package directions"
❌ "Prepare vegetables by washing and chopping"

CORRECT (Single responsibility):
✅ "Heat 2 tablespoons oil in large skillet" (2 min, stovetop_1)
✅ "Add diced onions to hot oil" (30 sec, stovetop_1)
✅ "Dice 1 medium onion into ¼-inch pieces" (3 min, prep_station)
✅ "Mince 3 garlic cloves finely" (2 min, prep_station)
✅ "Season chicken breast with salt" (30 sec, prep_station)
✅ "Season chicken breast with pepper" (30 sec, prep_station)
✅ "Place seasoned chicken in hot skillet" (30 sec, stovetop_1)
✅ "Fill large pot with 4 quarts water" (1 min, prep_station)
✅ "Add 2 tablespoons salt to water" (30 sec, prep_station)
✅ "Bring salted water to rolling boil" (8 min, stovetop_2)
✅ "Add pasta to boiling water" (30 sec, stovetop_2)
✅ "Cook pasta for 8 minutes" (8 min, stovetop_2)
✅ "Wash carrots under cold water" (1 min, prep_station)
✅ "Peel washed carrots with vegetable peeler" (2 min, prep_station)
✅ "Cut peeled carrots into ½-inch rounds" (3 min, prep_station)

EXTREME GRANULARITY EXAMPLES:
Original: "Prepare the sauce"
Ultra-granular breakdown:
1. "Heat small saucepan over medium heat" (2 min, stovetop_3)
2. "Add 2 tablespoons butter to heated pan" (30 sec, stovetop_3)  
3. "Let butter melt completely" (1 min, stovetop_3)
4. "Add 2 tablespoons flour to melted butter" (30 sec, stovetop_3)
5. "Whisk flour into butter until smooth" (1 min, stovetop_3)
6. "Cook flour mixture for 2 minutes while whisking" (2 min, stovetop_3)
7. "Slowly pour ½ cup milk while whisking" (1 min, stovetop_3)
8. "Continue whisking until mixture is smooth" (1 min, stovetop_3)
9. "Simmer sauce for 3 minutes until thickened" (3 min, stovetop_3)

ARTIFACT STRATEGY:
Create fine-grained parallel tracks:
- Equipment-based: oven_prep, stovetop_1, stovetop_2, stovetop_3, prep_station
- Component-based: protein_prep, vegetable_prep, sauce_making, starch_cooking
- Process-based: seasoning, marinating, resting, plating

TIMING REQUIREMENTS:
- Every step with heat, cooking, or waiting gets duration_minutes
- Steps should be 30 seconds to 10 minutes maximum
- Break longer processes into checkpointed steps

Remember: If you can identify two distinct actions in one step, split them into separate steps!

Respond with artifacts and annotated_steps arrays only.`,
        },
        {
          role: "user",
          content: recipeText,
        },
      ],
      response_format: zodResponseFormat(
        z.object({
          artifacts: z.array(ArtifactSchema).min(1),
          annotated_steps: z.array(AnnotatedStepSchema).min(1),
        }),
        "track_analysis"
      ),
    });

    const parsed = completion.choices[0].message?.parsed;
    if (!parsed) {
      throw new Error("Failed to parse recipe into tracks");
    }

    const graph = buildStepGraph(parsed.artifacts, parsed.annotated_steps);
    
    console.log(`✅ [parseExistingRecipeIntoTracks] Successfully parsed into ${graph.tracks.length} tracks`);
    return graph;
  } catch (error) {
    console.error(`❌ [parseExistingRecipeIntoTracks] Error parsing recipe:`, error);
    
    // Fallback to single track
    return {
      tracks: [{
        track_id: "main",
        title: recipe.title,
        emoji: "🍽️",
        steps: recipe.instructions.map((instruction, index) => ({
          step_id: `step_${index + 1}`,
          number: index + 1,
          instruction,
          duration_minutes: undefined,
        })),
      }],
      joins: [],
      warnings: ["Failed to parse into parallel tracks, using single track fallback"],
    };
  }
}