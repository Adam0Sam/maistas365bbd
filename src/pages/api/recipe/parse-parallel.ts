import { parseRecipeAnnotatedAI } from "@/lib/parse-full-recipe";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { recipe, requirements, target_servings } = req.body ?? {};
  
  if (!recipe) {
    return res.status(400).json({ error: "recipe is required" });
  }

  try {
    console.log("🔄 [parse-parallel] Starting parallel track parsing...");
    
    // Parse recipe with parallel track annotations
    const result = await parseRecipeAnnotatedAI({
      recipe: typeof recipe === 'string' ? recipe : JSON.stringify(recipe),
      requirements,
      target_servings
    });
    
    console.log("✅ [parse-parallel] Successfully parsed recipe with tracks:", {
      trackCount: result.graph.tracks.length,
      tracks: result.graph.tracks.map(t => ({
        id: t.track_id,
        title: t.title,
        steps: t.steps.length
      })),
      joins: result.graph.joins.length
    });
    
    return res.status(200).json({
      recipe: result.recipe,
      graph: result.graph,
      annotations: result.annotations
    });
  } catch (err: any) {
    console.error("❌ [parse-parallel] Error parsing recipe:", err);
    
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid AI response", 
        details: err.errors 
      });
    }
    
    return res.status(500).json({ 
      error: err?.message ?? "Failed to parse recipe with parallel tracks" 
    });
  }
}