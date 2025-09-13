// src/components/ingredients/grouping.ts
import type { ParsedRecipe } from "@/lib/parse-full-recipe";

export type EditableIng = ParsedRecipe["ingredients"][number] & {
   included: boolean;
};
export type IndexedIng = { idx: number; ing: EditableIng };

export function toIndexed(items: EditableIng[]): IndexedIng[] {
   return items.map((ing, idx) => ({ idx, ing }));
}

export function splitIndexed(items: IndexedIng[]) {
   const core: IndexedIng[] = [];
   const supplementary: IndexedIng[] = [];
   for (const it of items) (it.ing.core ? core : supplementary).push(it);
   return { core, supplementary };
}

export function stepForUnit(unit?: string) {
   if (!unit) return 1;
   const u = unit.toLowerCase();
   if (u === "g" || u === "ml") return 50;
   if (u === "kg" || u === "l") return 0.1;
   if (u.includes("tbsp") || u.includes("tsp")) return 0.5;
   return 1;
}
