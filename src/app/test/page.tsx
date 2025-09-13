// src/app/test/page.tsx
"use client";

import { FoodMealModal } from "@/components/food-card/FoodCardModal";
import { GridMealCard } from "@/components/MealCard";
import { ParsedRecipe } from "@/lib/parse-full-recipe";
import { useEffect, useState } from "react";

export default function TestPageComponent() {
   const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
   const [open, setOpen] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function loadRecipe() {
         try {
            setLoading(true);
            setError(null);
            const res = await fetch(
               "http://localhost:3000/api/recipe/get-recipe-info",
               {
                  method: "POST",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                     recipe:
                        "STEP 1 Put the chicken breasts between two pieces of baking parchment and use a rolling pin to gently bash them until they are approximately 1cm thick.\nCut each chicken breast into two even pieces.\nSTEP 2 If you're using a frying pan, heat two frying pans over medium-high heat, with one of them containing oil.\nFry the chicken in the oiled pan for 3-4 mins on each side until they are cooked through.\nSeason the chicken, reduce the heat, drizzle in the chilli sauce and half of the lemon juice, and cook for an additional 1-2 mins until the sauce is reduced.\nRemove the chicken from the heat.\nSTEP 3 If you're using an air-fryer, preheat it to 180C for 4 mins.\nAdd the chicken to the air-fryer and cook for 12 mins.\nDrizzle over the chilli sauce and half the lemon juice and cook for an additional 1-2 mins until the chicken is cooked through and the sauce is reduced.\nRemove the chicken and keep it warm.\nSTEP 4 While the chicken is cooking, toast the buns in the dry frying pan for 30 seconds.\nTransfer them to a plate.\nIf you're using an air fryer, put the buns in the air fryer for 1-2 mins until they are warm.\nIncrease the air fryer temperature to 200C.\nAdd the halloumi to the air fryer basket and cook for 10 mins, turning halfway through, until it's golden.\nToss the cabbage with the mayo and the remaining lemon juice.\nSTEP 5 Spoon the hummus (or dip of your choice) into the toasted buns, then top with the rocket, chilli chicken, halloumi, and peppers.\nDrizzle with a little more chilli sauce, spoon over the cabbage, season with black pepper, and top with the bun lids.\nServe with any extra cabbage on the side or a green salad.",
                  }),
               }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.log("data", data)
            // Accept { recipe } or direct object
            const parsed: ParsedRecipe = data?.recipe ?? data;
            setRecipe(parsed);
         } catch (e: any) {
            setError(e?.message ?? "Failed to fetch recipe");
         } finally {
            setLoading(false);
         }
      }
      loadRecipe();
   }, []);

   if (loading) return <div className="p-8 text-center">Loading…</div>;
   if (error)
      return <div className="p-8 text-center text-red-500">{error}</div>;
   if (!recipe) return <div className="p-8 text-center">No recipe found</div>;

   return (
      <div className="min-h-screen p-6 flex items-start justify-center">
         <div className="w-full max-w-md">
            <GridMealCard
               recipe={recipe}
               index={0}
               onClick={() => setOpen(true)}
               onRemove={() => setRecipe(null)}
            />
         </div>

         {open && recipe && (
            <FoodMealModal
               recipe={recipe}
               onClose={() => setOpen(false)}
               onRemove={() => {
                  setOpen(false);
                  setRecipe(null);
               }}
            />
         )}
      </div>
   );
}
