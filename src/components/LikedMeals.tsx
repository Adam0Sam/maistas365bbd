'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, ShoppingBag, DollarSign, Trash2, ChefHat, Clock, Users, X, Check, CheckCircle2 } from 'lucide-react'
import { useLikedMeals } from '@/contexts/LikedMealsContext'
import { FoodItem } from '@/types/food'
import { useState, useEffect, useCallback } from 'react'
import { getUserState, shouldShowLandingPage } from '@/lib/localStorage'

interface LikedMealsProps {
  onBack: () => void
  onStartOver: () => void
}

// Fetch real meal data from API
const getMealData = async (meal: FoodItem) => {
  try {
    const recipeText = `Create a recipe using ${meal.name} as the main ingredient.`;
    const requirements = `Budget-friendly ingredients from ${meal.shopName || 'local grocery stores'}. Include nutritious and accessible ingredients.`;

    const response = await fetch('/api/chat/parse-recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipe: recipeText,
        requirements,
        fields: ['productId', 'name', 'price', 'shop'],
        limit: 5
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform API response to match expected format
    const ingredients = data.shopping_list?.map((item: {ingredient: string; chosen_product: {name: string; price: number} | null}) => ({
      name: item.chosen_product?.name || item.ingredient,
      amount: data.ingredients?.find((ing: {name: string; quantity: string}) => ing.name.toLowerCase().includes(item.ingredient.toLowerCase()))?.quantity || '1 unit',
      price: item.chosen_product?.price || 0,
      category: 'ingredient'
    })) || [];

    // Add the main meal item if not already included
    const mainIngredientExists = ingredients.some((ing: {name: string}) => 
      ing.name.toLowerCase().includes(meal.name.toLowerCase())
    );
    
    if (!mainIngredientExists) {
      ingredients.unshift({
        name: meal.name,
        amount: '1 lb',
        price: meal.price,
        category: meal.category || 'main'
      });
    }

    return {
      recipe: {
        description: `A delicious recipe featuring ${meal.name} with fresh ingredients and simple cooking techniques.`,
        cookTime: Math.floor(Math.random() * 45) + 15,
        servings: Math.floor(Math.random() * 4) + 2,
        difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)] as 'Easy' | 'Medium' | 'Hard',
        instructions: [
          'Prepare all ingredients by washing and chopping as needed',
          `Season the ${meal.name} with salt and pepper to taste`,
          'Heat oil in a large skillet over medium-high heat',
          'Add ingredients according to cooking requirements',
          'Cook until tender and flavors are well combined',
          'Taste and adjust seasoning as needed',
          'Serve hot and enjoy your delicious meal!'
        ]
      },
      ingredients
    };
  } catch (error) {
    console.error('Error fetching meal data:', error);
    // Fallback to basic data structure if API call fails
    return {
      recipe: {
        description: `A delicious ${meal.name} recipe that combines fresh ingredients with simple cooking techniques.`,
        cookTime: Math.floor(Math.random() * 45) + 15,
        servings: Math.floor(Math.random() * 4) + 2,
        difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)] as 'Easy' | 'Medium' | 'Hard',
        instructions: [
          'Prepare all ingredients by washing and chopping as needed',
          `Season the ${meal.name} with salt and pepper`,
          'Heat oil in a large skillet over medium-high heat',
          'Cook ingredients according to recipe specifications',
          'Taste and adjust seasoning as needed',
          'Serve hot and enjoy!'
        ]
      },
      ingredients: [
        { name: meal.name, amount: '1 lb', price: meal.price, category: meal.category || 'main' },
        { name: 'Olive Oil', amount: '2 tbsp', price: 0.50, category: 'pantry' },
        { name: 'Salt', amount: '1 tsp', price: 0.10, category: 'seasoning' },
        { name: 'Black Pepper', amount: '1/2 tsp', price: 0.15, category: 'seasoning' }
      ]
    };
  }
}

interface MealDataCache {
  [key: string]: ReturnType<typeof getMealData> extends Promise<infer T> ? T : never
}

export default function LikedMeals({ onBack, onStartOver }: LikedMealsProps) {
  const { likedMeals, removeLikedMeal, clearLikedMeals, markAsCompleted, markAsIncomplete, getUncompletedMeals } = useLikedMeals()
  const [selectedMeal, setSelectedMeal] = useState<FoodItem | null>(null)
  const [userStats, setUserStats] = useState({ totalRecipesGenerated: 0, totalRecipesLiked: 0 })
  const [isReturningUser, setIsReturningUser] = useState(false)
  const [mealDataCache, setMealDataCache] = useState<MealDataCache>({})
  const [loadingMeals, setLoadingMeals] = useState<Set<string>>(new Set())
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    const stats = getUserState()
    setUserStats({
      totalRecipesGenerated: stats.totalRecipesGenerated,
      totalRecipesLiked: stats.totalRecipesLiked
    })
    setIsReturningUser(!shouldShowLandingPage())
  }, [])

  const fetchMealData = useCallback(async (meal: FoodItem) => {
    if (mealDataCache[meal.id] || loadingMeals.has(meal.id)) {
      return mealDataCache[meal.id]
    }

    setLoadingMeals(prev => new Set(prev).add(meal.id))

    try {
      const data = await getMealData(meal)
      setMealDataCache(prev => ({ ...prev, [meal.id]: data }))
      return data
    } finally {
      setLoadingMeals(prev => {
        const newSet = new Set(prev)
        newSet.delete(meal.id)
        return newSet
      })
    }
  }, [mealDataCache, loadingMeals])

  const handleCardClick = async (meal: FoodItem) => {
    setSelectedMeal(meal)
    // Pre-fetch meal data if not already cached
    if (!mealDataCache[meal.id]) {
      await fetchMealData(meal)
    }
  }

  const handleCloseModal = () => {
    setSelectedMeal(null)
  }

  const handleToggleCompleted = (meal: FoodItem) => {
    if (meal.isCompleted) {
      markAsIncomplete(meal.id)
    } else {
      markAsCompleted(meal.id)
    }
  }

  // Filter meals based on completion status - always show uncompleted by default
  const uncompletedMeals = getUncompletedMeals()
  console.log("get uncompleted meals", uncompletedMeals)
  const completedMeals = likedMeals.filter(meal => meal.isCompleted)
  const displayedMeals = showCompleted ? completedMeals : uncompletedMeals

  const completedMealsCount = likedMeals.filter(meal => meal.isCompleted).length

  if (uncompletedMeals.length === 0 && !showCompleted) {
    return (
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-0 bg-background z-40 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-background/80 backdrop-blur-lg">
          <Button variant="secondary" size="sm" onClick={onBack} className="shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold">Your Favorites</h1>
          </div>

          <div className="w-16" />
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="text-6xl mb-6">🍽️</div>
            <h2 className="text-2xl font-bold mb-4">
              {completedMealsCount > 0 ? 'All meals cooked!' : (isReturningUser ? 'Ready to discover more?' : 'No favorites yet!')}
            </h2>
            <p className="text-muted-foreground mb-8">
              {completedMealsCount > 0
                ? `Great job! You've cooked ${completedMealsCount} meals. Time to discover new recipes!`
                : (isReturningUser 
                  ? `You've explored ${userStats.totalRecipesGenerated} recipes so far. Let's find more delicious meals!`
                  : "Start swiping to discover meals you'll love and they'll appear here."
                )
              }
            </p>
            <Button onClick={onStartOver} size="lg">
              <ChefHat className="h-5 w-5 mr-2" />
              Start Discovering
            </Button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 bg-background z-40 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-background/80 backdrop-blur-lg z-50">
        <Button variant="secondary" size="sm" onClick={onBack} className="shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold">
            {showCompleted ? 'Completed Meals' : 'Meals to Cook'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {uncompletedMeals.length} to cook • {completedMeals.length} completed • {userStats.totalRecipesGenerated} explored
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={showCompleted ? "default" : "outline"}
            size="sm" 
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {showCompleted ? "Show To Cook" : "Show Cooked"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearLikedMeals}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/95">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {displayedMeals.map((meal, index) => (
                <GridMealCard
                  key={meal.id}
                  meal={meal}
                  index={index}
                  onClick={() => handleCardClick(meal)}
                  onRemove={() => removeLikedMeal(meal.id)}
                  onToggleCompleted={() => handleToggleCompleted(meal)}
                  isCompleted={meal.isCompleted || false}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-lg">
        <div className="flex gap-4 justify-center max-w-md mx-auto">
          <Button variant="outline" onClick={onStartOver} className="flex-1">
            <ChefHat className="h-4 w-4 mr-2" />
            Find More
          </Button>
          <Button className="flex-1">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Create Recipe
          </Button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedMeal && (
          <MealModal
            meal={selectedMeal}
            mealData={mealDataCache[selectedMeal.id]}
            isLoading={loadingMeals.has(selectedMeal.id)}
            onClose={handleCloseModal}
            onRemove={() => {
              removeLikedMeal(selectedMeal.id)
              handleCloseModal()
            }}
            onToggleCompleted={() => {
              handleToggleCompleted(selectedMeal)
              handleCloseModal()
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface GridMealCardProps {
  meal: FoodItem
  index: number
  onClick: () => void
  onRemove: () => void
  onToggleCompleted: () => void
  isCompleted: boolean
}

function GridMealCard({ meal, index, onClick, onRemove, onToggleCompleted, isCompleted }: GridMealCardProps) {
  const displayPrice = typeof meal.price === 'number' ? meal.price.toFixed(2) : '0.00'
  const estimatedTime = Math.floor(Math.random() * 30) + 15
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        layout: { duration: 0.3 }
      }}
      whileHover={{ 
        scale: 1.02, 
        y: -2,
        transition: { duration: 0.2 }
      }}
      className="bg-card border border-border rounded-xl shadow-lg hover:shadow-xl cursor-pointer overflow-hidden transition-all duration-200"
      onClick={onClick}
    >
      {/* Card Image */}
      <div className={`h-32 flex items-center justify-center relative ${isCompleted ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-orange-50 to-red-50'}`}>
        <div className="text-4xl opacity-80">
          {isCompleted ? '✅' : (meal.category === 'recipe' ? '👨‍🍳' : '🍽️')}
        </div>
        {meal.category === 'recipe' && !isCompleted && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs bg-white/80 backdrop-blur-sm">
              Recipe
            </Badge>
          </div>
        )}
        {isCompleted && (
          <div className="absolute top-2 right-2">
            <Badge className="text-xs bg-green-600">
              Cooked
            </Badge>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Title and Action Buttons */}
        <div className="flex items-start gap-2">
          <h3 className={`text-lg font-bold line-clamp-2 flex-1 leading-tight ${isCompleted ? 'line-through opacity-60' : ''}`}>
            {meal.name}
          </h3>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleCompleted()
              }}
              className={`p-1.5 rounded-full transition-all duration-200 flex-shrink-0 mt-0.5 ${
                isCompleted 
                  ? 'hover:bg-orange-100 text-orange-500 opacity-100' 
                  : 'hover:bg-green-100 text-green-600 opacity-60 hover:opacity-100'
              }`}
              title={isCompleted ? 'Mark as not cooked' : 'Mark as cooked'}
              aria-label={isCompleted ? 'Mark as not cooked' : 'Mark as cooked'}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="p-1.5 rounded-full hover:bg-red-100 text-red-500 opacity-60 hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-0.5"
              title="Remove meal"
              aria-label="Remove meal"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        
        {/* Category and Price Row */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs px-2 py-1 truncate max-w-20">
            {meal.category || 'food'}
          </Badge>
          <div className="flex items-center gap-1 flex-shrink-0">
            <DollarSign className="h-3.5 w-3.5 text-green-600" />
            <span className="font-bold text-green-600 text-sm">
              ${displayPrice}
            </span>
          </div>
        </div>

        {/* Shop Name */}
        {meal.shopName && (
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {meal.shopName}
            </span>
          </div>
        )}

        {/* Time and Heart Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {estimatedTime}min
            </span>
          </div>
          <Heart className="h-4 w-4 text-red-500 fill-current opacity-80" />
        </div>
      </div>
    </motion.div>
  )
}

interface MealModalProps {
  meal: FoodItem
  mealData?: Awaited<ReturnType<typeof getMealData>>
  isLoading: boolean
  onClose: () => void
  onRemove: () => void
  onToggleCompleted: () => void
}

function MealModal({ meal, mealData, isLoading, onClose, onRemove, onToggleCompleted }: MealModalProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalIngredientPrice = mealData?.ingredients.reduce((sum: number, ing: {price: number}) => sum + (ing.price || 0), 0) || 0

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
        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
        className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{meal.name}</h2>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">{meal.category}</Badge>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">${meal.price}</span>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span>Loading recipe details...</span>
                </div>
              ) : mealData ? (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{mealData.recipe.cookTime}min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{mealData.recipe.servings} servings</span>
                  </div>
                  <Badge className={`text-xs px-2 py-0.5 ${getDifficultyColor(mealData.recipe.difficulty)}`}>
                    {mealData.recipe.difficulty}
                  </Badge>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              variant={meal.isCompleted ? "default" : "outline"}
              size="sm"
              onClick={onToggleCompleted}
              className={meal.isCompleted ? "bg-green-600 hover:bg-green-700" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
            >
              <Check className="h-4 w-4" />
              {meal.isCompleted ? "Cooked" : "Mark Cooked"}
            </Button>
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

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <p className="text-sm text-muted-foreground">Loading recipe details...</p>
            </div>
          ) : mealData ? (
            <>
              {/* Recipe Description */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">RECIPE</h4>
                <p className="text-sm leading-relaxed">{mealData.recipe.description}</p>
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">INGREDIENTS</h4>
                  <span className="text-sm font-bold text-green-600">
                    Total: ${totalIngredientPrice.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {mealData.ingredients.map((ingredient: {name: string; amount: string; price: number}, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{ingredient.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{ingredient.amount}</span>
                      </div>
                      <span className="text-xs font-semibold text-green-600">${ingredient.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">INSTRUCTIONS</h4>
                <ol className="space-y-3">
                  {mealData.recipe.instructions.map((step, idx) => (
                    <li key={idx} className="text-sm flex gap-3">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-2xl">⚠️</div>
              <p className="text-sm text-muted-foreground">Failed to load recipe details</p>
            </div>
          )}

          {/* Nutrition Info */}
          {meal.nutritionInfo && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">NUTRITION</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="font-bold text-lg text-primary">{meal.nutritionInfo.calories}</div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="font-bold text-lg text-accent">{meal.nutritionInfo.protein}g</div>
                  <div className="text-xs text-muted-foreground">Protein</div>
                </div>
                {meal.nutritionInfo.carbs && (
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-bold text-lg text-blue-600">{meal.nutritionInfo.carbs}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                )}
                {meal.nutritionInfo.fat && (
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-bold text-lg text-orange-600">{meal.nutritionInfo.fat}g</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}