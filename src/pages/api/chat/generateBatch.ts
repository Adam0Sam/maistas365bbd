// src/pages/api/recipe/generate-batch.ts
import { generateAndPlanRecipes } from "@/lib/generateAndParse";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const BodySchema = z.object({
   requirements: z.string().min(1),
   prompt: z.string().optional(),
   fields: z.array(z.string()).optional(),
   limit: z.number().int().positive().optional(),
});

export default async function handler(
   req: NextApiRequest,
   res: NextApiResponse
) {
   if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
   }

   const parsed = BodySchema.safeParse(req.body ?? {});
   if (!parsed.success) {
      return res
         .status(400)
         .json({ error: "invalid body", details: parsed.error.flatten() });
   }

   try {
      const data = await generateAndPlanRecipes(parsed.data);
      return res.status(200).json(data);
   } catch (err: any) {
      console.error("generate-batch error:", err);
      if (err instanceof z.ZodError) {
         return res
            .status(400)
            .json({ error: "Invalid AI response", details: err.errors });
      }
      return res.status(500).json({ error: err?.message ?? "Unknown error" });
   }
}
