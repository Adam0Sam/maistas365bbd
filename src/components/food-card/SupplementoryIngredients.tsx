// src/components/ingredients/SupplementaryIngredientsList.tsx
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check } from "lucide-react";
import { IndexedIng } from "../grouping";

type Props = {
   items: IndexedIng[];
   onToggleInclude: (globalIdx: number) => void;
   onBump: (globalIdx: number, dir: 1 | -1) => void;
   onChangeQuantityValue: (globalIdx: number, value: number) => void;
   readOnly?: boolean;
};

export default function SupplementaryIngredientsList({
   items,
   onToggleInclude,
   readOnly = false,
}: Props) {
   const includedCount = items.filter(({ ing }) => ing.included).length;

   return (
      <section className="space-y-3">
         <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-muted-foreground">
               SUPPLEMENTARY
            </h4>
            <Badge variant="secondary" className="text-xs">
               {includedCount}/{items.length} included
            </Badge>
         </div>

         <div className="flex flex-wrap gap-2">
            {items.map(({ idx, ing }) => (
               <SupChip
                  key={`${ing.name}-${idx}`}
                  idx={idx}
                  name={ing.name}
                  unit={ing.unit ?? ""}
                  value={ing.quantity_value ?? 0}
                  included={ing.included}
                  onToggleInclude={onToggleInclude}
                  readOnly={readOnly}
               />
            ))}
         </div>
      </section>
   );
}

function SupChip({
   idx,
   name,
   unit,
   value,
   included,
   onToggleInclude,
   readOnly,
}: {
   idx: number;
   name: string;
   unit: string;
   value: number;
   included: boolean;
   onToggleInclude: (idx: number) => void;
   readOnly: boolean;
}) {
   const ref = useRef<HTMLDivElement>(null);
   const [bias, setBias] = useState<"left" | "right" | "none">("none");
   const [intensity, setIntensity] = useState(0);

   const onMove = (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ratio = (e.clientX - r.left) / r.width;
      if (ratio < 0.45) {
         setBias("left");
         setIntensity(Math.min(1, (0.45 - ratio) / 0.45));
      } else if (ratio > 0.55) {
         setBias("right");
         setIntensity(Math.min(1, (ratio - 0.55) / 0.45));
      } else {
         setBias("none");
         setIntensity(0);
      }
   };
   const reset = () => {
      setBias("none");
      setIntensity(0);
   };
   const clickSelect = () => {
      if (readOnly) return;
      if (bias === "left" && !included) onToggleInclude(idx);
      if (bias === "right" && included) onToggleInclude(idx);
   };

   return (
      <div className="relative">
         <motion.div
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={reset}
            onClick={clickSelect}
            whileHover={{ y: -1 }}
            className={`group relative inline-flex items-center gap-2 rounded-full border px-3 py-1.5 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] ring-1 ring-black/5 select-none cursor-pointer transition
          ${
             included
                ? "border-emerald-500/70 bg-emerald-50/40"
                : "border-border hover:border-foreground/30"
          }`}
         >
            <motion.span
               className="absolute inset-y-0 left-0 w-1/2 rounded-l-full pointer-events-none"
               style={{
                  opacity: !readOnly && bias === "left" ? intensity : 0,
                  background:
                     "linear-gradient(90deg, rgba(34,197,94,0.30), rgba(34,197,94,0.06) 70%, transparent)",
               }}
            />
            <motion.span
               className="absolute inset-y-0 right-0 w-1/2 rounded-r-full pointer-events-none"
               style={{
                  opacity: !readOnly && bias === "right" ? intensity : 0,
                  background:
                     "linear-gradient(270deg, rgba(239,68,68,0.30), rgba(239,68,68,0.06) 70%, transparent)",
               }}
            />

            <span className="relative text-base">🥦</span>
            <span className="relative text-sm font-medium truncate max-w-[10rem]">
               {name}
            </span>
            <span className="relative text-xs text-muted-foreground">
               {value}
               {unit ? ` ${unit}` : ""}
            </span>
            {included && (
               <Check className="relative h-3.5 w-3.5 text-emerald-600 opacity-80" />
            )}
            {!readOnly && (
               <Pencil className="relative h-3.5 w-3.5 text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition" />
            )}
         </motion.div>
      </div>
   );
}
