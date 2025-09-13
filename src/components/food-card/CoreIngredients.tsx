// src/components/ingredients/CoreIngredientsList.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check } from "lucide-react";
import { IndexedIng } from "../grouping";

type CoreIngredientsListProps = {
   items: IndexedIng[];
   onBump: (globalIdx: number, dir: 1 | -1) => void;
   onChangeQuantityValue: (globalIdx: number, value: number) => void;
   readOnly?: boolean;
};

export default function CoreIngredientsList({
   items,
   readOnly = false,
}: CoreIngredientsListProps) {
   const [open, setOpen] = useState<number | null>(null);

   return (
      <section className="space-y-3">
         <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-muted-foreground">
               CORE INGREDIENTS
            </h4>
            <Badge variant="secondary" className="text-xs">
               {items.length} required
            </Badge>
         </div>

         <div className="flex flex-wrap gap-2">
            {items.map(({ idx, ing }) => {
               const val = ing.quantity_value ?? 0;
               const unit = ing.unit ?? "";

               return (
                  <div key={`${ing.name}-${idx}`} className="relative">
                     <div className="group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] ring-1 ring-black/5 border-emerald-500/60 bg-emerald-50/40">
                        <span className="text-base">🍳</span>
                        <span className="text-sm font-medium truncate max-w-[12rem]">
                           {ing.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                           {val}
                           {unit ? ` ${unit}` : ""}
                        </span>
                        <Check className="h-3.5 w-3.5 text-emerald-600 opacity-80" />
                        {!readOnly && (
                           <button
                              onClick={() => setOpen(open === idx ? null : idx)}
                              className="ml-1 rounded-full p-1 hover:bg-black/[.04]"
                           >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                           </button>
                        )}
                     </div>

                     {/* (kept for completeness; won't show when readOnly) */}
                     {!readOnly && (
                        <AnimatePresence>
                           {open === idx && (
                              <motion.div
                                 initial={{ opacity: 0, y: -4 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -4 }}
                                 className="absolute left-0 right-0 translate-y-2 z-10"
                              >
                                 <div className="mx-auto w-max rounded-full border bg-background/95 backdrop-blur px-3 py-1 shadow-md text-xs text-muted-foreground">
                                    Quantities are now AI-driven.
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     )}
                  </div>
               );
            })}
         </div>
      </section>
   );
}
