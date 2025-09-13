// src/components/GridMealCard.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParsedRecipe } from "@/lib/parse-full-recipe";
import { motion } from "framer-motion";
import { Clock, Heart, Trash2, Users, X } from "lucide-react";

type GridMealCardProps = {
   recipe: ParsedRecipe;
   index: number;
   onClick: () => void;
   onRemove: () => void;
};

export function GridMealCard({
   recipe,
   index,
   onClick,
   onRemove,
}: GridMealCardProps) {
   const { info, ingredients } = recipe;

   const totalMinutes =
      info.total_minutes ??
      (typeof info.prep_minutes === "number" &&
      typeof info.cook_minutes === "number"
         ? info.prep_minutes + info.cook_minutes
         : undefined);

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95 }}
         transition={{
            duration: 0.28,
            delay: index * 0.05,
            layout: { duration: 0.28 },
         }}
         whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.18 } }}
         className="bg-card border border-border rounded-xl shadow-lg hover:shadow-xl cursor-pointer overflow-hidden transition-all duration-200"
         onClick={onClick}
      >
         {/* Image / header */}
         <div className="h-32 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center relative">
            <div className="text-4xl opacity-80">👨‍🍳</div>
            <div className="absolute top-2 right-2">
               <Badge
                  variant="outline"
                  className="text-xs bg-white/80 backdrop-blur-sm"
               >
                  Recipe
               </Badge>
            </div>
         </div>

         {/* Content */}
         <div className="p-4 space-y-3">
            {/* Title + remove */}
            <div className="flex items-start gap-2">
               <h3 className="text-lg font-bold line-clamp-2 flex-1 leading-tight">
                  {info.title}
               </h3>
               <button
                  onClick={(e) => {
                     e.stopPropagation();
                     onRemove();
                  }}
                  className="p-1.5 rounded-full hover:bg-red-100 text-red-500 opacity-70 hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-0.5"
                  aria-label="Remove meal"
               >
                  <Trash2 className="h-3.5 w-3.5" />
               </button>
            </div>

            {/* Meta row: servings / total time / difficulty */}
            <div className="flex items-center justify-between gap-2">
               <div className="flex items-center gap-2">
                  {typeof info.servings === "number" && (
                     <Badge variant="secondary" className="text-xs px-2 py-1">
                        <Users className="h-3 w-3 mr-1" />
                        {info.servings}
                     </Badge>
                  )}
                  {typeof totalMinutes === "number" && (
                     <Badge variant="secondary" className="text-xs px-2 py-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {totalMinutes} min
                     </Badge>
                  )}
                  {info.difficulty && (
                     <Badge
                        variant="outline"
                        className="text-xs px-2 py-1 capitalize"
                     >
                        {info.difficulty}
                     </Badge>
                  )}
               </div>
               <Heart className="h-4 w-4 text-red-500 fill-current opacity-80" />
            </div>

            {/* Ingredients preview */}
            {ingredients?.length > 0 && (
               <div>
                  <div className="flex flex-wrap gap-1">
                     {ingredients.slice(0, 4).map((ing, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                           {ing.quantity ? `${ing.quantity} ` : ""}
                           {ing.name}
                        </Badge>
                     ))}
                     {ingredients.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                           +{ingredients.length - 4} more
                        </Badge>
                     )}
                  </div>
               </div>
            )}
         </div>
      </motion.div>
   );
}

type MealModalProps = {
   recipe: ParsedRecipe;
   onClose: () => void;
   onRemove: () => void;
};

export function MealModal({ recipe, onClose, onRemove }: MealModalProps) {
   const { info, ingredients, steps } = recipe;

   const totalMinutes =
      info.total_minutes ??
      (typeof info.prep_minutes === "number" &&
      typeof info.cook_minutes === "number"
         ? info.prep_minutes + info.cook_minutes
         : undefined);

   // Difficulty tint
   const diffTint =
      info.difficulty === "easy"
         ? "text-green-600 bg-green-100"
         : info.difficulty === "medium"
         ? "text-yellow-600 bg-yellow-100"
         : info.difficulty === "hard"
         ? "text-red-600 bg-red-100"
         : "text-gray-600 bg-gray-100";

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
            className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border p-6 flex items-start justify-between">
               <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{info.title}</h2>
                  <div className="flex items-center gap-3 text-sm">
                     {typeof info.servings === "number" && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                           <Users className="h-4 w-4" />
                           {info.servings} servings
                        </span>
                     )}
                     {typeof totalMinutes === "number" && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                           <Clock className="h-4 w-4" />
                           {totalMinutes} min
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
               <div className="flex gap-2 ml-4">
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

            {/* Body */}
            <div className="p-6 space-y-6">
               {/* Description */}
               {info.description && (
                  <div>
                     <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                        RECIPE
                     </h4>
                     <p className="text-sm leading-relaxed">
                        {info.description}
                     </p>
                  </div>
               )}

               {/* Ingredients */}
               {ingredients?.length > 0 && (
                  <div>
                     <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                        INGREDIENTS
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {ingredients.map((ing, idx) => (
                           <div
                              key={idx}
                              className="p-3 bg-muted/30 rounded-lg text-sm"
                           >
                              <span className="font-medium">{ing.name}</span>
                              {ing.quantity && (
                                 <span className="text-xs text-muted-foreground ml-2">
                                    {ing.quantity}
                                 </span>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Steps */}
               {steps?.length > 0 && (
                  <div>
                     <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                        INSTRUCTIONS
                     </h4>
                     <ol className="space-y-3">
                        {steps
                           .slice()
                           .sort((a, b) => a.number - b.number)
                           .map((step, idx) => (
                              <li key={idx} className="text-sm flex gap-3">
                                 <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                 </span>
                                 <span className="leading-relaxed">
                                    {step.instruction}
                                 </span>
                              </li>
                           ))}
                     </ol>
                  </div>
               )}
            </div>
         </motion.div>
      </motion.div>
   );
}
