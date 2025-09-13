// src/components/ingredients/IngredientsPageBlock.tsx
"use client";

import { Button } from "@/components/ui/button";
import { IndexedIng } from "../grouping";
import SupplementaryIngredientsList from "./SupplementoryIngredients";
import CoreIngredientsList from "./CoreIngredients";
type Props = {
   description?: string;
   core: IndexedIng[];
   supplementary: IndexedIng[];
   onBump: (idx: number, dir: 1 | -1) => void;
   onChangeQuantityValue: (idx: number, value: number) => void;
   onToggleInclude: (idx: number) => void;
   onClose: () => void;
   onSaveIngredients: () => void;
   readonlyQuantities?: boolean;
};

export default function IngredientsPageBlock({
   description,
   core,
   supplementary,
   onBump,
   onChangeQuantityValue,
   onToggleInclude,
   onClose,
   onSaveIngredients,
   readonlyQuantities = false,
}: Props) {
   return (
      <>
         {description && (
            <div>
               <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
               </p>
            </div>
         )}

         <CoreIngredientsList
            items={core}
            onBump={onBump}
            onChangeQuantityValue={onChangeQuantityValue}
            readOnly={readonlyQuantities}
         />

         <div className="h-2" />

         <SupplementaryIngredientsList
            items={supplementary}
            onToggleInclude={onToggleInclude}
            onBump={onBump}
            onChangeQuantityValue={onChangeQuantityValue}
            readOnly={readonlyQuantities}
         />

         <div className="flex items-center justify-between pt-4">
            <div className="text-xs text-muted-foreground">
               {core.length} core •{" "}
               {supplementary.filter(({ ing }) => ing.included).length}{" "}
               supplementary
            </div>
            <div className="flex gap-2">
               <Button variant="outline" onClick={onClose}>
                  Cancel
               </Button>
               <Button onClick={onSaveIngredients}>Save & Continue</Button>
            </div>
         </div>
      </>
   );
}
