// src/pages/api/recipe/plan.ts
import { planRecipe } from "@/lib/parse-recipe-ai";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

export default async function handler(
   req: NextApiRequest,
   res: NextApiResponse
) {
   if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
   }

   const { recipe, requirements, fields, limit } = req.body ?? {};
   if (!recipe) return res.status(400).json({ error: "recipe is required" });
   if (!requirements)
      return res.status(400).json({ error: "requirements are required" });

   try {
      const result = await planRecipe({ recipe, requirements, fields, limit });
      return res.status(200).json(result);
   } catch (err: any) {
      console.error("plan error:", err);
      if (err instanceof z.ZodError) {
         return res
            .status(400)
            .json({ error: "Invalid AI response", details: err.errors });
      }
      return res.status(500).json({ error: err?.message ?? "Unknown error" });
   }
}
