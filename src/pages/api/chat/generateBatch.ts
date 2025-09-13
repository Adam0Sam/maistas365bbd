// src/pages/api/chat/generateBatch.ts
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
   console.log("🚀 [generateBatch] API endpoint called");
   console.log("🚀 [generateBatch] Request method:", req.method);
   console.log("🚀 [generateBatch] Request body:", JSON.stringify(req.body, null, 2));
   
   if (req.method !== "POST") {
      console.log("❌ [generateBatch] Method not allowed:", req.method);
      return res.status(405).json({ error: "Method not allowed" });
   }

   console.log("🔍 [generateBatch] Validating request body...");
   const parsed = BodySchema.safeParse(req.body ?? {});
   if (!parsed.success) {
      console.log("❌ [generateBatch] Body validation failed:", parsed.error);
      return res
         .status(400)
         .json({ error: "invalid body", details: parsed.error.flatten() });
   }
   
   console.log("✅ [generateBatch] Body validation passed");
   console.log("🔍 [generateBatch] Parsed data:", JSON.stringify(parsed.data, null, 2));

   try {
      console.log("🔄 [generateBatch] Starting recipe generation with retry logic...");
      // Add retry logic for transient failures
      let lastError: any;
      for (let attempt = 1; attempt <= 2; attempt++) {
         console.log(`🔄 [generateBatch] Attempt ${attempt}/2`);
         try {
            console.log("📞 [generateBatch] Calling generateAndPlanRecipes...");
            const data = await generateAndPlanRecipes(parsed.data);
            console.log("✅ [generateBatch] generateAndPlanRecipes completed successfully");
            console.log("📊 [generateBatch] Result summary:", {
               totalRecipes: data.length,
               successfulRecipes: data.filter(r => r.ok).length,
               failedRecipes: data.filter(r => !r.ok).length
            });
            console.log("🚀 [generateBatch] Returning successful response");
            return res.status(200).json(data);
         } catch (err: any) {
            lastError = err;
            console.log(`❌ [generateBatch] Attempt ${attempt} failed:`, err.message);
            console.log(`❌ [generateBatch] Full error:`, err);
            if (attempt === 1 && !err.message?.includes('Invalid')) {
               // Retry once for non-validation errors
               console.warn(`🔄 [generateBatch] Attempt ${attempt} failed, retrying...`, err.message);
               continue;
            }
            throw err;
         }
      }
      throw lastError;
   } catch (err: any) {
      console.error("💥 [generateBatch] Final error:", err);
      console.error("💥 [generateBatch] Error stack:", err.stack);
      if (err instanceof z.ZodError) {
         console.error("💥 [generateBatch] Zod validation error:", err.errors);
         return res
            .status(400)
            .json({ error: "Invalid AI response", details: err.errors });
      }
      console.error("💥 [generateBatch] Unknown error, returning 500");
      return res.status(500).json({ error: err?.message ?? "Unknown error" });
   }
}
