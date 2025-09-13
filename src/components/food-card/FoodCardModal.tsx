// src/components/meal/FoodMealModal.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParsedRecipe } from "@/lib/parse-full-recipe";
import { motion } from "framer-motion";
import { ChevronLeft, Clock, Trash2, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EditableIng, splitIndexed, toIndexed } from "../grouping";
import HorizontalStepFlow from "../steps/ParallelSteps";
import IngredientsPageBlock from "./IngredientsList";

type MealModalProps = {
   recipe: ParsedRecipe;
   rawRecipe: string; // ← needed to regenerate for new servings
   onClose: () => void;
   onRemove: () => void;
   onUpdateIngredients?: (ings: ParsedRecipe["ingredients"]) => void;
};
type Page = "ingredients" | "steps";

export function FoodMealModal({
   recipe: initialRecipe,
   rawRecipe,
   onClose,
   onRemove,
   onUpdateIngredients,
}: MealModalProps) {
   const [page, setPage] = useState<Page>("ingredients");
   const [recipe, setRecipe] = useState<ParsedRecipe>(initialRecipe);
   const [loading, setLoading] = useState(false);
   const [servings, setServings] = useState<number>(
      initialRecipe.info.servings
   );

   const info = recipe.info;
   const steps = recipe.steps;

   const totalMinutes =
      info.total_minutes ??
      (typeof info.prep_minutes === "number" &&
      typeof info.cook_minutes === "number"
         ? info.prep_minutes + info.cook_minutes
         : undefined);

   const diffTint =
      info.difficulty === "easy"
         ? "text-green-600 bg-green-100"
         : info.difficulty === "medium"
         ? "text-yellow-600 bg-yellow-100"
         : info.difficulty === "hard"
         ? "text-red-600 bg-red-100"
         : "text-gray-600 bg-gray-100";

   // Build editable list ONLY for include toggles (no quantity editing anymore)
   const initialEditable: EditableIng[] = useMemo(
      () =>
         recipe.ingredients.map((i) => ({
            ...i,
            included: i.core ? true : true,
         })),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [recipe] // rebuild whenever recipe changes (e.g., after scaling)
   );
   const [editableIngs, setEditableIngs] =
      useState<EditableIng[]>(initialEditable);
   useEffect(() => setEditableIngs(initialEditable), [initialEditable]);

   const indexed = useMemo(() => toIndexed(editableIngs), [editableIngs]);
   const { core, supplementary } = useMemo(
      () => splitIndexed(indexed),
      [indexed]
   );

   const onToggleInclude = (idx: number) => {
      setEditableIngs((prev) => {
         const n = prev.slice();
         if (n[idx].core) return n;
         n[idx] = { ...n[idx], included: !n[idx].included };
         return n;
      });
   };

   // Regenerate ingredients at new servings
   const refetchForServings = async (target: number) => {
      setLoading(true);
      try {
         const res = await fetch(
            "http://localhost:3000/api/recipe/get-recipe-info",
            {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  recipe: rawRecipe,
                  target_servings: target,
               }),
            }
         );
         if (!res.ok) throw new Error(`HTTP ${res.status}`);
         const data = await res.json();
         const next: ParsedRecipe = data.recipe ?? data;
         setRecipe(next);
         setServings(next.info.servings);
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.2 }}
         className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
         onClick={onClose}
      >
         <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{
               duration: 0.3,
               type: "spring",
               stiffness: 300,
               damping: 30,
            }}
            className="bg-background rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border p-6">
               <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                     <h2 className="text-2xl font-bold mb-2">{info.title}</h2>
                     <div className="flex items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                           <Users className="h-4 w-4" /> {servings} servings
                        </span>
                        {typeof totalMinutes === "number" && (
                           <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" /> {totalMinutes} min
                           </span>
                        )}
                        {info.difficulty && (
                           <Badge
                              className={`text-xs px-2 py-0.5 capitalize ${diffTint}`}
                           >
                              {info.difficulty}
                           </Badge>
                        )}
                     </div>
                  </div>

                  {/* Portions stepper */}
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-muted-foreground">
                        Portions
                     </span>
                     <div className="inline-flex items-center rounded-full border bg-white shadow-sm">
                        <button
                           className="px-3 py-1 text-sm hover:bg-muted rounded-l-full"
                           onClick={() => {
                              const next = Math.max(1, servings - 1);
                              setServings(next);
                              refetchForServings(next);
                           }}
                           disabled={loading}
                        >
                           −
                        </button>
                        <input
                           aria-label="Servings"
                           value={servings}
                           onChange={(e) => {
                              const next = Math.max(
                                 1,
                                 Number(e.target.value || 1)
                              );
                              setServings(next);
                           }}
                           onBlur={() => refetchForServings(servings)}
                           className="w-12 text-center text-sm outline-none bg-transparent py-1"
                           type="number"
                           min={1}
                        />
                        <button
                           className="px-3 py-1 text-sm hover:bg-muted rounded-r-full"
                           onClick={() => {
                              const next = servings + 1;
                              setServings(next);
                              refetchForServings(next);
                           }}
                           disabled={loading}
                        >
                           +
                        </button>
                     </div>
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={onRemove}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                     <Button variant="outline" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                     </Button>
                  </div>
               </div>

               {/* Tabs */}
               <div className="mt-4">
                  <div className="inline-flex rounded-lg border border-border overflow-hidden">
                     <button
                        onClick={() => setPage("ingredients")}
                        className={`px-4 py-2 text-sm ${
                           page === "ingredients"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                        }`}
                     >
                        Ingredients
                     </button>
                     <button
                        onClick={() => setPage("steps")}
                        className={`px-4 py-2 text-sm ${
                           page === "steps"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                        }`}
                     >
                        Steps
                     </button>
                  </div>
                  {loading && (
                     <span className="ml-3 text-xs text-muted-foreground">
                        Updating for {servings}…
                     </span>
                  )}
               </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
               {page === "ingredients" ? (
                  <IngredientsPageBlock
                     description={info.description}
                     core={core}
                     supplementary={supplementary}
                     // 👇 no quantity editing anymore
                     onBump={() => {}}
                     onChangeQuantityValue={() => {}}
                     onToggleInclude={onToggleInclude}
                     onClose={onClose}
                     onSaveIngredients={() => setPage("steps")}
                     readonlyQuantities // <- tell child lists to hide editors
                  />
               ) : (
                  <div>
                     <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                        INSTRUCTIONS
                     </h4>
                     {steps?.length ? (
                        <HorizontalStepFlow
                           steps={recipe.steps}
                           title={recipe.info.title}
                           onFinish={onClose}
                        />
                     ) : (
                        <p className="text-sm text-muted-foreground">
                           No steps available.
                        </p>
                     )}

                     <div className="flex items-center justify-between pt-6">
                        <Button
                           variant="outline"
                           onClick={() => setPage("ingredients")}
                        >
                           <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <Button onClick={onClose}>Done</Button>
                     </div>
                  </div>
               )}
            </div>
         </motion.div>
      </motion.div>
   );
}
