"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { ParsedRecipe } from "@/lib/parse-full-recipe";

type Step = ParsedRecipe["steps"][number];

type Props = {
   steps: Step[];
   title?: string;
   className?: string;
   onFinish?: () => void;
};

export default function HorizontalStepFlow({
   steps,
   title = "Cooking",
   className,
   onFinish,
}: Props) {
   const ordered = useMemo(
      () => steps.slice().sort((a, b) => a.number - b.number),
      [steps]
   );
   const [active, setActive] = useState(0);
   const [done, setDone] = useState<boolean[]>(() => ordered.map(() => false));

   // keyboard: ← / → and Enter
   useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "ArrowRight") {
            e.preventDefault();
            goNext();
         }
         if (e.key === "ArrowLeft") {
            e.preventDefault();
            goPrev();
         }
         if (e.key === "Enter") {
            e.preventDefault();
            markDone();
         }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [active, done]);

   const goPrev = () => setActive((a) => Math.max(0, a - 1));
   const goNext = () => setActive((a) => Math.min(ordered.length - 1, a + 1));

   const markDone = () => {
      setDone((prev) => {
         const next = prev.slice();
         next[active] = true;
         return next;
      });
      if (active < ordered.length - 1) {
         setActive(active + 1);
      } else {
         onFinish?.();
      }
   };

   return (
      <div
         className={`rounded-3xl p-4 md:p-6 bg-cyan-100/60 border border-cyan-200/70 ${
            className ?? ""
         }`}
      >
         {/* Header row */}
         <div className="mb-4 md:mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
               <h3 className="text-lg md:text-xl font-semibold">{title}</h3>
               <Badge variant="secondary" className="text-xs">
                  Step {active + 1} / {ordered.length}
               </Badge>
            </div>
            <div className="flex items-center gap-2">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  disabled={active === 0}
               >
                  <ChevronLeft className="h-4 w-4" />
               </Button>
               <Button
                  size="sm"
                  onClick={goNext}
                  disabled={active === ordered.length - 1}
               >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
               </Button>
            </div>
         </div>

         {/* Stage + right rail */}
         <div className="grid grid-cols-12 gap-4 md:gap-6 items-stretch">
            {/* BIG STAGE (left) */}
            <div className="col-span-12 lg:col-span-9">
               <div className="rounded-3xl p-3 md:p-4 bg-neutral-900 border-2 border-red-300/70 text-neutral-50">
                  <AnimatePresence initial={false} mode="popLayout">
                     {ordered.map((s, i) =>
                        i === active ? (
                           <motion.div
                              key={s.number}
                              layoutId={`step-shell-${s.number}`}
                              initial={{ opacity: 0.8, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{
                                 type: "spring",
                                 stiffness: 160,
                                 damping: 26,
                              }}
                              className="relative rounded-3xl p-4 md:p-6 border-2 border-amber-400 bg-amber-100 text-neutral-900 min-h-[260px] md:min-h-[340px] flex flex-col justify-between"
                           >
                              <div className="flex-1">
                                 <div className="text-xs md:text-sm text-amber-900/80 mb-2">
                                    Step {i + 1}
                                 </div>
                                 <div className="text-base md:text-lg leading-relaxed">
                                    {s.instruction}
                                 </div>
                              </div>

                              <div className="mt-6 flex items-center justify-between">
                                 <div className="text-xs text-neutral-700">
                                    {done[i] ? (
                                       <span className="inline-flex items-center gap-1 text-emerald-700">
                                          <Check className="h-4 w-4" />{" "}
                                          Completed
                                       </span>
                                    ) : (
                                       <span className="opacity-60">
                                          Mark when finished
                                       </span>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <Button
                                       variant="outline"
                                       onClick={goPrev}
                                       disabled={i === 0}
                                    >
                                       <ChevronLeft className="h-4 w-4 mr-1" />{" "}
                                       Back
                                    </Button>
                                    <Button onClick={markDone}>
                                       {i === ordered.length - 1
                                          ? "Finish"
                                          : "Done →"}
                                    </Button>
                                 </div>
                              </div>

                              {/* little arrow hint */}
                              <div className="hidden lg:block absolute inset-y-0 right-[-10px] my-auto text-amber-600">
                                 →
                              </div>
                           </motion.div>
                        ) : null
                     )}
                  </AnimatePresence>
               </div>
            </div>

            {/* RIGHT RAIL (collapsed pillars) */}
            <div className="col-span-12 lg:col-span-3 flex lg:flex-col gap-3">
               {ordered.map((s, i) =>
                  i === active ? null : (
                     <CollapsedPillar
                        key={s.number}
                        layoutId={`step-shell-${s.number}`}
                        label={`Step ${i + 1}`}
                        done={done[i]}
                        onClick={() => setActive(i)}
                     />
                  )
               )}
            </div>
         </div>
      </div>
   );
}

/* Collapsed pillar shown on the right rail */
function CollapsedPillar({
   layoutId,
   label,
   done,
   onClick,
}: {
   layoutId: string;
   label: string;
   done: boolean;
   onClick: () => void;
}) {
   return (
      <motion.button
         layoutId={layoutId}
         onClick={onClick}
         className={`relative flex-1 lg:h-28 rounded-3xl border-2 transition overflow-hidden
        bg-neutral-900 text-neutral-50 border-red-300/70 hover:border-red-400/80`}
         whileHover={{ y: -2 }}
         transition={{ type: "spring", stiffness: 300, damping: 26 }}
         title={label}
      >
         <div className="absolute inset-0 p-3 flex items-center lg:flex-col lg:items-start lg:justify-between gap-2">
            <div className="text-xs md:text-sm font-semibold opacity-90">
               {label}
            </div>
            <Badge
               variant={done ? "secondary" : "outline"}
               className="text-[10px]"
            >
               {done ? "Done" : "Queued"}
            </Badge>
         </div>
         {/* tiny left hint of yellow content */}
         <div className="absolute left-1 top-1 bottom-1 w-1.5 rounded-full bg-amber-300/90" />
      </motion.button>
   );
}
