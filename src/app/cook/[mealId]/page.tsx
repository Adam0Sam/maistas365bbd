"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChefHat, Check, ShoppingCart, Clock, Users, Star, ChevronRight, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecipeModal } from "@/components/RecipeModal";
import { useLikedMeals } from "@/contexts/LikedMealsContext";
import { FoodItem } from "@/types/food";
import { ParsedRecipe, StepGraph } from "@/lib/parse-full-recipe";

export default function CookPage() {
  const params = useParams();
  const router = useRouter();
  const { getLikedMealById, likedMeals } = useLikedMeals();
  const [meal, setMeal] = useState<FoodItem | null>(null);
  const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
  const [graph, setGraph] = useState<StepGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set());
  const [showCookingModal, setShowCookingModal] = useState(false);

  useEffect(() => {
    const encodedMealId = params.mealId as string;
    const mealId = decodeURIComponent(encodedMealId);
    console.log("Encoded meal ID:", encodedMealId);
    console.log("Decoded meal ID:", mealId);
    
    if (!mealId) {
      setError("Invalid meal ID");
      setIsLoading(false);
      return;
    }

    // Get the meal from liked meals
    console.log("All liked meals:", likedMeals);
    console.log("Liked meals count:", likedMeals.length);
    likedMeals.forEach((meal, index) => {
      console.log(`Meal ${index}:`, { id: meal.id, name: meal.name });
    });
    
    const foundMeal = getLikedMealById(mealId);
    console.log("Found meal:", foundMeal);
    
    if (!foundMeal) {
      setError(`Meal not found in your favorites. Looking for ID: ${mealId}`);
      setIsLoading(false);
      return;
    }

    setMeal(foundMeal);

    // Convert FoodItem recipeData to ParsedRecipe format
    if (foundMeal.recipeData) {
      const convertedRecipe: ParsedRecipe = {
        info: {
          title: foundMeal.recipeData.generated.title || foundMeal.name,
          description: foundMeal.recipeData.generated.description,
          servings: foundMeal.recipeData.generated.servings,
          prep_minutes: 10, // Default values since they're not in the stored data
          cook_minutes: 20,
          total_minutes: 30,
          difficulty: "medium" as const
        },
        ingredients: foundMeal.recipeData.generated.ingredients.map((ing, index) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: "",
          quantity_value: 1,
          core: index < 3 // Mark first 3 as core ingredients
        })),
        steps: foundMeal.recipeData.generated.instructions.map((instruction, index) => ({
          instruction,
          number: index + 1
        }))
      };

      // Create a basic graph structure if we have the recipeData
      const basicGraph: StepGraph = {
        tracks: [
          {
            track_id: "main",
            title: foundMeal.name,
            emoji: "🍽️",
            steps: foundMeal.recipeData.generated.instructions.map((instruction, index) => ({
              step_id: `step_${index + 1}`,
              number: index + 1,
              instruction,
              duration_minutes: instruction.includes("cook") || instruction.includes("bake") ? 
                Math.floor(Math.random() * 10) + 5 : null
            }))
          }
        ],
        joins: [],
        warnings: []
      };

      setRecipe(convertedRecipe);
      setGraph(basicGraph);
    } else {
      // Fallback for meals without recipe data
      const fallbackRecipe: ParsedRecipe = {
        info: {
          title: foundMeal.name,
          description: `A delicious ${foundMeal.name} recipe`,
          servings: 4,
          prep_minutes: 10,
          cook_minutes: 20,
          total_minutes: 30,
          difficulty: "medium" as const
        },
        ingredients: [
          { name: foundMeal.name, quantity: "1 lb", unit: "", quantity_value: 1, core: true },
          { name: "Olive Oil", quantity: "2 tbsp", unit: "", quantity_value: 2, core: false },
          { name: "Salt", quantity: "1 tsp", unit: "", quantity_value: 1, core: false },
          { name: "Black Pepper", quantity: "1/2 tsp", unit: "", quantity_value: 0.5, core: false }
        ],
        steps: [
          { instruction: "Prepare all ingredients", number: 1 },
          { instruction: "Heat oil in a large pan", number: 2 },
          { instruction: `Cook ${foundMeal.name} until done`, number: 3 },
          { instruction: "Season with salt and pepper", number: 4 },
          { instruction: "Serve hot and enjoy", number: 5 }
        ]
      };
      setRecipe(fallbackRecipe);
    }

    setIsLoading(false);
  }, [params.mealId, getLikedMealById, likedMeals]);

  const handleBack = () => {
    router.back();
  };

  const toggleIngredient = (index: number) => {
    setSelectedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleStartCooking = () => {
    setShowIngredientsModal(false);
    setShowCookingModal(true);
  };

  const getSelectedCount = () => selectedIngredients.size;
  const getTotalCount = () => recipe?.ingredients?.length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-lg font-medium text-muted-foreground">Loading recipe...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !meal || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md p-8"
        >
          <div className="text-6xl mb-6">😵</div>
          <h2 className="text-2xl font-bold mb-4">Recipe Not Found</h2>
          <p className="text-muted-foreground mb-8">
            {error || "We couldn't find this recipe. It may have been removed from your favorites."}
          </p>
          <Button onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with Design System Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(135deg, #8ea4d2 0%, #6279b8 25%, #49516f 50%, #496f5d 75%, #4c9f70 100%)',
        opacity: 0.03
      }}></div>
      
      {/* Floating Orbs */}
      <div 
        className="absolute top-20 left-10 w-64 h-64 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse"
        style={{ background: 'linear-gradient(135deg, #5db382 0%, #3d8059 100%)' }}
      ></div>
      <div 
        className="absolute bottom-20 right-10 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"
        style={{ 
          background: 'linear-gradient(135deg, #a4b8dc 0%, #6279b8 100%)', 
          animationDelay: '2s' 
        }}
      ></div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              className="shadow-sm hover:shadow-md transition-all duration-300 border-neutral-300 hover:border-primary-400 hover:text-primary-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Favorites
            </Button>
            
            <div className="text-center">
              <h1 
                className="text-2xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)' }}
              >
                {recipe.info.title}
              </h1>
              <div className="flex items-center justify-center gap-6 mt-2 text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-primary-500" />
                  <span>{recipe.info.servings} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-accent-500" />
                  <span>{recipe.info.total_minutes} min</span>
                </div>
                <Badge 
                  className="text-white"
                  style={{ background: 'linear-gradient(90deg, #8ea4d2 0%, #6279b8 100%)' }}
                >
                  {recipe.info.difficulty}
                </Badge>
              </div>
            </div>

            <div className="w-32" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative inline-block mb-6"
            >
              <div className="text-8xl drop-shadow-lg">
                {meal.category === 'recipe' ? '👨‍🍳' : '🍽️'}
              </div>
              <div 
                className="absolute -inset-4 rounded-full blur-xl -z-10"
                style={{ background: 'linear-gradient(90deg, rgba(93, 179, 130, 0.3) 0%, rgba(84, 105, 164, 0.3) 100%)' }}
              ></div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              {recipe.info.description || `Let's cook this amazing ${meal.name} together! First, let's check what ingredients you have available.`}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={() => setShowIngredientsModal(true)}
                size="lg"
                className="h-14 px-8 text-lg font-semibold text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
                style={{ 
                  background: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)',
                  backgroundSize: '200% 100%',
                  backgroundPosition: '0% 0%',
                  transition: 'background-position 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundPosition = '100% 0%';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundPosition = '0% 0%';
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                Check Your Ingredients
                <ChevronRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(90deg, #4c9f70 0%, #3d8059 100%)' }}
                >
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-neutral-800">Ingredients</h3>
              </div>
              <p className="text-2xl font-bold text-primary-600">{getTotalCount()}</p>
              <p className="text-sm text-neutral-600">items needed</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(90deg, #6279b8 0%, #5469a4 100%)' }}
                >
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-neutral-800">Cook Time</h3>
              </div>
              <p className="text-2xl font-bold text-accent-600">{recipe.info.total_minutes}</p>
              <p className="text-sm text-neutral-600">minutes total</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(90deg, #8ea4d2 0%, #7490c8 100%)' }}
                >
                  <Star className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-neutral-800">Difficulty</h3>
              </div>
              <p className="text-2xl font-bold text-secondary-600 capitalize">{recipe.info.difficulty}</p>
              <p className="text-sm text-neutral-600">skill level</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Ingredients Selection Modal */}
      <AnimatePresence>
        {showIngredientsModal && (
          <IngredientsModal
            recipe={recipe}
            selectedIngredients={selectedIngredients}
            onToggleIngredient={toggleIngredient}
            onClose={() => setShowIngredientsModal(false)}
            onStartCooking={handleStartCooking}
          />
        )}
      </AnimatePresence>

      {/* Cooking Modal */}
      <AnimatePresence>
        {showCookingModal && (
          <RecipeModal
            recipe={recipe}
            graph={graph}
            isOpen={true}
            onClose={handleBack}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Ingredients Selection Modal Component
interface IngredientsModalProps {
  recipe: ParsedRecipe;
  selectedIngredients: Set<number>;
  onToggleIngredient: (index: number) => void;
  onClose: () => void;
  onStartCooking: () => void;
}

function IngredientsModal({
  recipe,
  selectedIngredients,
  onToggleIngredient,
  onClose,
  onStartCooking,
}: IngredientsModalProps) {
  const selectedCount = selectedIngredients.size;
  const totalCount = recipe.ingredients.length;
  const completionPercentage = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="relative p-6 text-white"
          style={{ background: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="pr-12">
            <h2 className="text-2xl font-bold mb-2">Check Your Ingredients</h2>
            <p className="text-white/90 mb-4">
              Select the ingredients you have available at home
            </p>
            
            {/* Progress Bar */}
            <div className="bg-white/20 rounded-full h-2 mb-2">
              <motion.div
                className="bg-white h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-white/80">
              {selectedCount} of {totalCount} ingredients selected
            </p>
          </div>
        </div>

        {/* Ingredients List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => {
              const isSelected = selectedIngredients.has(index);
              const isCore = ingredient.core;

              return (
                <motion.button
                  key={index}
                  onClick={() => onToggleIngredient(index)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 group ${
                    isSelected
                      ? 'border-green-300 shadow-lg'
                      : 'bg-neutral-50 border-neutral-200 hover:border-primary-200 hover:bg-primary-25'
                  }`}
                  style={isSelected ? {
                    background: 'linear-gradient(90deg, rgba(76, 159, 112, 0.1) 0%, rgba(84, 105, 164, 0.1) 100%)'
                  } : {}}
                >
                  {/* Checkbox */}
                  <div 
                    className={`relative flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-transparent'
                        : 'border-neutral-300 group-hover:border-primary-400'
                    }`}
                    style={isSelected ? {
                      background: 'linear-gradient(90deg, #4c9f70 0%, #6279b8 100%)'
                    } : {}}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Ingredient Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold transition-colors ${
                        isSelected ? 'text-primary-800' : 'text-neutral-800 group-hover:text-primary-700'
                      }`}>
                        {ingredient.name}
                      </h3>
                      {isCore && (
                        <Badge 
                          className="text-white text-xs"
                          style={{ background: 'linear-gradient(90deg, #6279b8 0%, #5469a4 100%)' }}
                        >
                          Essential
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm transition-colors ${
                      isSelected ? 'text-primary-600' : 'text-neutral-600'
                    }`}>
                      {ingredient.quantity} {ingredient.unit}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  <div 
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      isSelected
                        ? 'shadow-lg'
                        : 'bg-neutral-300 group-hover:bg-primary-400'
                    }`}
                    style={isSelected ? {
                      background: 'linear-gradient(90deg, #4c9f70 0%, #6279b8 100%)'
                    } : {}}
                  />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-200">
          <div className="flex gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 border-neutral-300 hover:border-primary-400 hover:text-primary-600"
            >
              Cancel
            </Button>
            <Button
              onClick={onStartCooking}
              disabled={selectedCount === 0}
              className="flex-1 h-12 text-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              style={{ 
                background: selectedCount === 0 ? '#94a3b8' : 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)',
                transition: 'background 0.3s ease'
              }}
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Start Cooking ({selectedCount})
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}