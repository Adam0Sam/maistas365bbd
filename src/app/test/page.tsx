// src/app/test/page.tsx
"use client";

import { FoodMealModal } from "@/components/food-card/FoodCardModal";
import { GridMealCard } from "@/components/MealCard";
import { RecipeModal } from "@/components/RecipeModal";
import {
  ParsedRecipe,
  StepGraph,
  GraphTrack,
  GraphJoin,
  GraphSimpleStep,
} from "@/lib/parse-full-recipe";
import { useEffect, useState } from "react";

export default function TestPageComponent() {
  const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
  const [graph, setGraph] = useState<StepGraph | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecipe() {
      try {
        setLoading(true);
        setError(null);
        // const res = await fetch(
        //    "http://localhost:3000/api/recipe/get-recipe-info",
        //    {
        //       method: "POST",
        //       headers: {
        //          "Content-Type": "application/json",
        //       },
        //       body: JSON.stringify({
        //          recipe:
        //             "STEP 1 Put the chicken breasts between two pieces of baking parchment and use a rolling pin to gently bash them until they are approximately 1cm thick.\nCut each chicken breast into two even pieces.\nSTEP 2 If you're using a frying pan, heat two frying pans over medium-high heat, with one of them containing oil.\nFry the chicken in the oiled pan for 3-4 mins on each side until they are cooked through.\nSeason the chicken, reduce the heat, drizzle in the chilli sauce and half of the lemon juice, and cook for an additional 1-2 mins until the sauce is reduced.\nRemove the chicken from the heat.\nSTEP 3 If you're using an air-fryer, preheat it to 180C for 4 mins.\nAdd the chicken to the air-fryer and cook for 12 mins.\nDrizzle over the chilli sauce and half the lemon juice and cook for an additional 1-2 mins until the chicken is cooked through and the sauce is reduced.\nRemove the chicken and keep it warm.\nSTEP 4 While the chicken is cooking, toast the buns in the dry frying pan for 30 seconds.\nTransfer them to a plate.\nIf you're using an air fryer, put the buns in the air fryer for 1-2 mins until they are warm.\nIncrease the air fryer temperature to 200C.\nAdd the halloumi to the air fryer basket and cook for 10 mins, turning halfway through, until it's golden.\nToss the cabbage with the mayo and the remaining lemon juice.\nSTEP 5 Spoon the hummus (or dip of your choice) into the toasted buns, then top with the rocket, chilli chicken, halloumi, and peppers.\nDrizzle with a little more chilli sauce, spoon over the cabbage, season with black pepper, and top with the bun lids.\nServe with any extra cabbage on the side or a green salad.",
        //       }),
        //    }
        // );

        // if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // const data = await res.json();
        const data = {
          recipe: {
            info: {
              title: "Chilli chicken and halloumi buns",
              description: "",
              servings: 4,
              prep_minutes: 10,
              cook_minutes: 20,
              total_minutes: 30,
              difficulty: "medium",
            },
            ingredients: [
              {
                name: "chicken breasts",
                quantity: "%",
                unit: "",
                quantity_value: 0.01,
                core: true,
              },
              {
                name: "baking parchment",
                quantity: "as needed",
                unit: "",
                quantity_value: 0.01,
                core: false,
              },
              {
                name: "oil",
                quantity: "as needed",
                unit: "",
                quantity_value: 0.01,
                core: false,
              },
              {
                name: "chilli sauce",
                quantity: "to taste",
                unit: "",
                quantity_value: 0.01,
                core: true,
              },
              {
                name: "lemon juice",
                quantity: "to taste",
                unit: "",
                quantity_value: 0.01,
                core: false,
              },
              {
                name: "buns",
                quantity: "as needed",
                unit: "",
                quantity_value: 0.01,
                core: true,
              },
              {
                name: "halloumi",
                quantity: "as needed",
                unit: "",
                quantity_value: 0.01,
                core: true,
              },
              {
                name: "cabbage",
                quantity: "as needed",
                unit: "",
                quantity_value: 0.01,
                core: true,
              },
              {
                name: "mayo",
                quantity: "to taste",
                unit: "",
                quantity_value: 0.01,
                core: false,
              },
              {
                name: "hummus (or dip of your choice)",
                quantity: "as needed",
                unit: "",
                quantity_value: 0.01,
                core: false,
              },
              {
                name: "rocket",
                quantity: "as needed",
                unit: "",
                quantity_value: 0.01,
                core: false,
              },
              {
                name: "peppers",
                quantity: "as needed",
                unit: "",
                quantity_value: 0.01,
                core: false,
              },
              {
                name: "black pepper",
                quantity: "to taste",
                unit: "",
                quantity_value: 0.01,
                core: false,
              },
              {
                name: "green salad (optional)",
                quantity: "optional",
                unit: "",
                quantity_value: 0.01,
                core: false,
              },
            ],
            steps: [
              {
                instruction:
                  "Put the chicken breasts between two pieces of baking parchment and use a rolling pin to gently bash them until they are approximately 1cm thick.",
                number: 1,
              },
              {
                instruction: "Cut each chicken breast into two even pieces.",
                number: 2,
              },
              {
                instruction:
                  "If you're using a frying pan, heat two frying pans over medium-high heat, with one of them containing oil.",
                number: 3,
              },
              {
                instruction:
                  "Fry the chicken in the oiled pan for 3-4 mins on each side until they are cooked through.",
                number: 4,
              },
              {
                instruction:
                  "Season the chicken, reduce the heat, drizzle in the chilli sauce and half of the lemon juice, and cook for an additional 1-2 mins until the sauce is reduced.",
                number: 5,
              },
              {
                instruction: "Remove the chicken from the heat.",
                number: 6,
              },
              {
                instruction:
                  "If you're using an air-fryer, preheat it to 180C for 4 mins.",
                number: 7,
              },
              {
                instruction:
                  "Add the chicken to the air-fryer and cook for 12 mins.",
                number: 8,
              },
              {
                instruction:
                  "Drizzle over the chilli sauce and half the lemon juice and cook for an additional 1-2 mins until the chicken is cooked through and the sauce is reduced.",
                number: 9,
              },
              {
                instruction: "Remove the chicken and keep it warm.",
                number: 10,
              },
              {
                instruction:
                  "While the chicken is cooking, toast the buns in the dry frying pan for 30 seconds.",
                number: 11,
              },
              {
                instruction: "Transfer them to a plate.",
                number: 12,
              },
              {
                instruction:
                  "If you're using an air fryer, put the buns in the air fryer for 1-2 mins until they are warm.",
                number: 13,
              },
              {
                instruction: "Increase the air fryer temperature to 200C.",
                number: 14,
              },
              {
                instruction:
                  "Add the halloumi to the air fryer basket and cook for 10 mins, turning halfway through, until it's golden.",
                number: 15,
              },
              {
                instruction:
                  "Toss the cabbage with the mayo and the remaining lemon juice.",
                number: 16,
              },
              {
                instruction:
                  "Spoon the hummus (or dip of your choice) into the toasted buns, then top with the rocket, chilli chicken, halloumi, and peppers.",
                number: 17,
              },
              {
                instruction:
                  "Drizzle with a little more chilli sauce, spoon over the cabbage, season with black pepper, and top with the bun lids.",
                number: 18,
              },
              {
                instruction:
                  "Serve with any extra cabbage on the side or a green salad.",
                number: 19,
              },
            ],
          },
          annotations: {
            artifacts: [
              {
                id: "chicken",
                title: "Chilli chicken",
                emoji: "🍗",
              },
              {
                id: "buns",
                title: "Toasted buns",
                emoji: "🥯",
              },
              {
                id: "halloumi",
                title: "Cooked halloumi",
                emoji: "🧀",
              },
              {
                id: "cabbage",
                title: "Cabbage slaw",
                emoji: "🥬",
              },
              {
                id: "hummus",
                title: "Hummus / dip",
                emoji: "🥣",
              },
              {
                id: "rocket",
                title: "Rocket",
                emoji: "🌱",
              },
              {
                id: "peppers",
                title: "Peppers",
                emoji: "🫑",
              },
            ],
            annotated_steps: [
              {
                step_id: "s1",
                number: 1,
                instruction:
                  "Put the chicken breasts between two pieces of baking parchment and use a rolling pin to gently bash them until they are approximately 1cm thick.",
                role: "simple",
                primary_artifact_id: "chicken",
                duration_minutes: null,
              },
              {
                step_id: "s2",
                number: 2,
                instruction: "Cut each chicken breast into two even pieces.",
                role: "simple",
                primary_artifact_id: "chicken",
                duration_minutes: null,
              },
              {
                step_id: "s3",
                number: 3,
                instruction:
                  "If you're using a frying pan, heat two frying pans over medium-high heat, with one of them containing oil.",
                role: "simple",
                primary_artifact_id: "chicken",
                duration_minutes: null,
              },
              {
                step_id: "s4",
                number: 4,
                instruction:
                  "Fry the chicken in the oiled pan for 3-4 mins on each side until they are cooked through.",
                role: "simple",
                primary_artifact_id: "chicken",
                duration_minutes: null,
              },
              {
                step_id: "s5",
                number: 5,
                instruction:
                  "Season the chicken, reduce the heat, drizzle in the chilli sauce and half of the lemon juice, and cook for an additional 1-2 mins until the sauce is reduced.",
                role: "simple",
                primary_artifact_id: "chicken",
                duration_minutes: null,
              },
              {
                step_id: "s6",
                number: 6,
                instruction: "Remove the chicken from the heat.",
                role: "simple",
                primary_artifact_id: "chicken",
                duration_minutes: null,
              },
              {
                step_id: "s7",
                number: 7,
                instruction:
                  "If you're using an air-fryer, preheat it to 180C for 4 mins.",
                role: "simple",
                primary_artifact_id: "chicken",
                duration_minutes: null,
              },
              {
                step_id: "s8",
                number: 8,
                instruction:
                  "Add the chicken to the air-fryer and cook for 12 mins.",
                role: "simple",
                primary_artifact_id: "chicken",
                duration_minutes: null,
              },
              {
                step_id: "s9",
                number: 9,
                instruction:
                  "Drizzle over the chilli sauce and half the lemon juice and cook for an additional 1-2 mins until the chicken is cooked through and the sauce is reduced.",
                role: "simple",
                primary_artifact_id: "chicken",
                duration_minutes: null,
              },
              {
                step_id: "s10",
                number: 10,
                instruction: "Remove the chicken and keep it warm.",
                role: "simple",
                primary_artifact_id: "chicken",
                duration_minutes: null,
              },
              {
                step_id: "s11",
                number: 11,
                instruction:
                  "While the chicken is cooking, toast the buns in the dry frying pan for 30 seconds.",
                role: "simple",
                primary_artifact_id: "buns",
                duration_minutes: null,
              },
              {
                step_id: "s12",
                number: 12,
                instruction: "Transfer them to a plate.",
                role: "simple",
                primary_artifact_id: "buns",
                duration_minutes: null,
              },
              {
                step_id: "s13",
                number: 13,
                instruction:
                  "If you're using an air fryer, put the buns in the air fryer for 1-2 mins until they are warm.",
                role: "simple",
                primary_artifact_id: "buns",
                duration_minutes: null,
              },
              {
                step_id: "s14",
                number: 14,
                instruction: "Increase the air fryer temperature to 200C.",
                role: "simple",
                primary_artifact_id: "halloumi",
                duration_minutes: null,
              },
              {
                step_id: "s15",
                number: 15,
                instruction:
                  "Add the halloumi to the air fryer basket and cook for 10 mins, turning halfway through, until it's golden.",
                role: "simple",
                primary_artifact_id: "halloumi",
                duration_minutes: null,
              },
              {
                step_id: "s16",
                number: 16,
                instruction:
                  "Toss the cabbage with the mayo and the remaining lemon juice.",
                role: "simple",
                primary_artifact_id: "cabbage",
                duration_minutes: null,
              },
              {
                step_id: "s17",
                number: 17,
                instruction:
                  "Spoon the hummus (or dip of your choice) into the toasted buns, then top with the rocket, chilli chicken, halloumi, and peppers.",
                role: "join",
                depends_on_artifacts: [
                  "hummus",
                  "buns",
                  "rocket",
                  "chicken",
                  "halloumi",
                  "peppers",
                ],
              },
              {
                step_id: "s18",
                number: 18,
                instruction:
                  "Drizzle with a little more chilli sauce, spoon over the cabbage, season with black pepper, and top with the bun lids.",
                role: "join",
                depends_on_artifacts: [
                  "buns",
                  "cabbage",
                  "chicken",
                  "halloumi",
                  "hummus",
                  "rocket",
                  "peppers",
                ],
              },
              {
                step_id: "s19",
                number: 19,
                instruction:
                  "Serve with any extra cabbage on the side or a green salad.",
                role: "simple",
                primary_artifact_id: "buns",
                duration_minutes: null,
              },
            ],
          },
          graph: {
            tracks: [
              {
                track_id: "chicken",
                title: "Chilli chicken",
                emoji: "🍗",
                steps: [
                  {
                    step_id: "s1",
                    number: 1,
                    instruction:
                      "Put the chicken breasts between two pieces of baking parchment and use a rolling pin to gently bash them until they are approximately 1cm thick.",
                    duration_minutes: 1,
                  },
                  {
                    step_id: "s2",
                    number: 2,
                    instruction:
                      "Cut each chicken breast into two even pieces.",
                    duration_minutes: 10,
                  },
                  {
                    step_id: "s3",
                    number: 3,
                    instruction:
                      "If you're using a frying pan, heat two frying pans over medium-high heat, with one of them containing oil.",
                    duration_minutes: 3,
                  },
                  {
                    step_id: "s4",
                    number: 4,
                    instruction:
                      "Fry the chicken in the oiled pan for 3-4 mins on each side until they are cooked through.",
                    duration_minutes: 20,
                  },
                  {
                    step_id: "s5",
                    number: 5,
                    instruction:
                      "Season the chicken, reduce the heat, drizzle in the chilli sauce and half of the lemon juice, and cook for an additional 1-2 mins until the sauce is reduced.",
                    duration_minutes: null,
                  },
                  {
                    step_id: "s6",
                    number: 6,
                    instruction: "Remove the chicken from the heat.",
                    duration_minutes: null,
                  },
                  {
                    step_id: "s7",
                    number: 7,
                    instruction:
                      "If you're using an air-fryer, preheat it to 180C for 4 mins.",
                    duration_minutes: null,
                  },
                  {
                    step_id: "s8",
                    number: 8,
                    instruction:
                      "Add the chicken to the air-fryer and cook for 12 mins.",
                    duration_minutes: null,
                  },
                  {
                    step_id: "s9",
                    number: 9,
                    instruction:
                      "Drizzle over the chilli sauce and half the lemon juice and cook for an additional 1-2 mins until the chicken is cooked through and the sauce is reduced.",
                    duration_minutes: null,
                  },
                  {
                    step_id: "s10",
                    number: 10,
                    instruction: "Remove the chicken and keep it warm.",
                    duration_minutes: null,
                  },
                ],
              },
              {
                track_id: "buns",
                title: "Toasted buns",
                emoji: "🥯",
                steps: [
                  {
                    step_id: "s11",
                    number: 1,
                    instruction:
                      "While the chicken is cooking, toast the buns in the dry frying pan for 30 seconds.",
                    duration_minutes: null,
                  },
                  {
                    step_id: "s12",
                    number: 2,
                    instruction: "Transfer them to a plate.",
                    duration_minutes: null,
                  },
                  {
                    step_id: "s13",
                    number: 3,
                    instruction:
                      "If you're using an air fryer, put the buns in the air fryer for 1-2 mins until they are warm.",
                    duration_minutes: null,
                  },
                  {
                    step_id: "s19",
                    number: 4,
                    instruction:
                      "Serve with any extra cabbage on the side or a green salad.",
                    duration_minutes: null,
                  },
                ],
              },
              {
                track_id: "halloumi",
                title: "Cooked halloumi",
                emoji: "🧀",
                steps: [
                  {
                    step_id: "s14",
                    number: 1,
                    instruction: "Increase the air fryer temperature to 200C.",
                    duration_minutes: null,
                  },
                  {
                    step_id: "s15",
                    number: 2,
                    instruction:
                      "Add the halloumi to the air fryer basket and cook for 10 mins, turning halfway through, until it's golden.",
                    duration_minutes: null,
                  },
                ],
              },
              {
                track_id: "cabbage",
                title: "Cabbage slaw",
                emoji: "🥬",
                steps: [
                  {
                    step_id: "s16",
                    number: 1,
                    instruction:
                      "Toss the cabbage with the mayo and the remaining lemon juice.",
                    duration_minutes: null,
                  },
                ],
              },
            ],
            joins: [
              {
                step_id: "s17",
                title:
                  "Spoon the hummus (or dip of your choice) into the toasted buns, then top with the rocket, chilli chicken, halloumi, and peppers",
                instruction:
                  "Spoon the hummus (or dip of your choice) into the toasted buns, then top with the rocket, chilli chicken, halloumi, and peppers.",
                depends_on: [
                  "hummus",
                  "buns",
                  "rocket",
                  "chicken",
                  "halloumi",
                  "peppers",
                ],
              },
              {
                step_id: "s18",
                title:
                  "Drizzle with a little more chilli sauce, spoon over the cabbage, season with black pepper, and top with the bun lids",
                instruction:
                  "Drizzle with a little more chilli sauce, spoon over the cabbage, season with black pepper, and top with the bun lids.",
                depends_on: [
                  "buns",
                  "cabbage",
                  "chicken",
                  "halloumi",
                  "hummus",
                  "rocket",
                  "peppers",
                ],
              },
            ],
            warnings: [],
          },
        };

        console.log("data", data);
        // The API now returns { recipe, graph }
        setRecipe(data.recipe);
        setGraph(data.graph);
      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch recipe");
      } finally {
        setLoading(false);
      }
    }
    loadRecipe();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!recipe) return <div className="p-8 text-center">No recipe found</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{recipe.info.title}</h1>
          <p className="text-gray-600 mb-4">{recipe.info.description}</p>
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            <span>🍽️ {recipe.info.servings} servings</span>
            <span>⏱️ {recipe.info.total_minutes} min</span>
            <span>📊 {recipe.info.difficulty}</span>
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="w-full max-w-md mx-auto bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
        >
          Start Cooking
        </button>
      </div>

      <RecipeModal
        recipe={recipe}
        graph={graph}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
