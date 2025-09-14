import { generateRecipesWithParallelTracks } from "@/lib/generateWithParallelTracks";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const BodySchema = z.object({
  requirements: z.string().min(1),
  prompt: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("🚀 [generateBatchWithTracks] API endpoint called");
  console.log("🚀 [generateBatchWithTracks] Request method:", req.method);
  console.log("🚀 [generateBatchWithTracks] Request body:", JSON.stringify(req.body, null, 2));
  
  if (req.method !== "POST") {
    console.log("❌ [generateBatchWithTracks] Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("🔍 [generateBatchWithTracks] Validating request body...");
  const parsedBody = BodySchema.safeParse(req.body ?? {});
  if (!parsedBody.success) {
    console.log("❌ [generateBatchWithTracks] Body validation failed:", parsedBody.error);
    return res
      .status(400)
      .json({ error: "invalid body", details: parsedBody.error.flatten() });
  }

  try {
    console.log("✅ [generateBatchWithTracks] Body validation passed");
    console.log("🔍 [generateBatchWithTracks] Parsed data:", JSON.stringify(parsedBody.data, null, 2));
    
    // Generate recipes with parallel tracks
    const recipesWithGraphs = await generateRecipesWithParallelTracks(parsedBody.data);
    
    console.log(`✅ [generateBatchWithTracks] Successfully generated ${recipesWithGraphs.length} recipes with parallel tracks`);
    
    // Format response to match expected structure
    const formattedRecipes = recipesWithGraphs.map(recipe => ({
      ...recipe,
      // Include the graph data so it can be stored with the recipe
      graph: recipe.graph,
      // Also include a flat instructions array for backward compatibility
      instructions: recipe.instructions
    }));
    
    return res.status(200).json(formattedRecipes);
  } catch (error: any) {
    console.error("❌ [generateBatchWithTracks] Error generating recipes:", error);
    
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid AI response", details: error.errors });
    }
    
    return res.status(500).json({ 
      error: error?.message ?? "Failed to generate recipes with parallel tracks" 
    });
  }
}