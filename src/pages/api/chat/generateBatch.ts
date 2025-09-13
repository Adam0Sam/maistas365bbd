// src/pages/api/chat/generateBatch.ts
import { generateAndPlanRecipes, generateRecipes } from "@/lib/generateAndParse";
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
   console.log("🚀 [generateBatch] API endpoint called");
   console.log("🚀 [generateBatch] Request method:", req.method);
   console.log("🚀 [generateBatch] Request body:", JSON.stringify(req.body, null, 2));
   
   if (req.method !== "POST") {
      console.log("❌ [generateBatch] Method not allowed:", req.method);
      return res.status(405).json({ error: "Method not allowed" });
   }

   console.log("🔍 [generateBatch] Validating request body...");
   const parsedBody = BodySchema.safeParse(req.body ?? {});
   if (!parsedBody.success) {
      console.log("❌ [generateBatch] Body validation failed:", parsedBody.error);
      return res
         .status(400)
         .json({ error: "invalid body", details: parsedBody.error.flatten() });
   }
   const batchedRecipes = await generateRecipes(parsedBody.data)
   console.log("✅ [generateBatch] Body validation passed");
   console.log("🔍 [generateBatch] Parsed data:", JSON.stringify(parsedBody.data, null, 2));
   return res.status(200).json(batchedRecipes)
}
