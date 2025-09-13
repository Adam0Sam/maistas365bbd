// src/pages/api/recipe/get-recipe-info.ts
import {
   parseFullRecipeAI,
   ParseFullRecipeBodySchema,
   parseRecipeAnnotatedAI,
} from "@/lib/parse-full-recipe";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
   req: NextApiRequest,
   res: NextApiResponse
) {
   if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });
   console.log("req.body", req.body)
   const parsed = ParseFullRecipeBodySchema.safeParse(req.body ?? {});
   if (!parsed.success) {
      return res
         .status(400)
         .json({ error: "invalid body", details: parsed.error.flatten() });
   }

   try {
      const data = await parseRecipeAnnotatedAI(parsed.data);
      res.status(200).json({ recipe: data });
   } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e?.message ?? "Unknown error" });
   }
}
