'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, ShoppingBag, Trash2, ChefHat, Clock, Users, X, Check, CheckCircle2, PlayCircle } from 'lucide-react'
import { useLikedMeals } from '@/contexts/LikedMealsContext'
import { FoodItem } from '@/types/food'
import { useState, useEffect, useCallback } from 'react'
import { getUserState, shouldShowLandingPage } from '@/lib/localStorage'
import { useRouter } from 'next/navigation'

// Animated Bubbles Component
const AnimatedBubbles = () => {
  const bubbles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 80 + 15,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 15 + 10,
    opacity: Math.random() * 0.4 + 0.1,
    color: Math.random()
  }))

  const getGradientColors = (color: number) => {
    if (color < 0.33) return 'from-blue-200/20 via-cyan-200/20 to-teal-200/20'
    if (color < 0.66) return 'from-purple-200/20 via-pink-200/20 to-rose-200/20'
    return 'from-orange-200/20 via-yellow-200/20 to-amber-200/20'
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className={`absolute rounded-full bg-gradient-to-br ${getGradientColors(bubble.color)} backdrop-blur-[2px] border border-white/10 shadow-lg`}
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.left}%`,
            opacity: bubble.opacity
          }}
          animate={{
            y: [typeof window !== 'undefined' ? window.innerHeight + bubble.size : 1000, -bubble.size],
            x: [0, Math.sin(bubble.id) * 150, Math.cos(bubble.id) * 100, 0],
            rotate: [0, bubble.id % 2 === 0 ? 360 : -360],
            scale: [0.8, 1.3, 0.9, 1.1, 0.8]
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Floating particles */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: Math.random() * 5 + 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

interface LikedMealsProps {
  onBack: () => void
  onStartOver: () => void
}

// Get meal data from stored recipeData (for recipes) or generate fallback (for food items)
const getMealData = async (meal: FoodItem) => {
  // If this is a recipe with stored data, use it directly
  if (meal.recipeData) {
    console.log(`✅ Using stored recipe data for ${meal.name} - no API call needed!`);
    const { generated, plan } = meal.recipeData;
    
    // Transform the stored data to match the expected format
    const ingredients = plan.shopping_list.map((item) => ({
      name: item.chosen_product.name,
      amount: plan.ingredients.find((ing) => 
        ing.name.toLowerCase().includes(item.ingredient.toLowerCase())
      )?.quantity || '1 unit',
      price: item.chosen_product.price,
      category: 'ingredient'
    }));

    // Calculate a reasonable difficulty based on ingredient count and instructions
    const getDifficulty = () => {
      const ingredientCount = generated.ingredients.length;
      const instructionCount = generated.instructions.length;
      
      if (ingredientCount <= 5 && instructionCount <= 4) return 'Easy';
      if (ingredientCount <= 10 && instructionCount <= 8) return 'Medium';
      return 'Hard';
    };

    // Estimate cook time based on instructions (more instructions = longer cook time)
    const estimatedCookTime = Math.min(15 + (generated.instructions.length * 5), 60);

    return {
      recipe: {
        description: generated.description,
        cookTime: estimatedCookTime,
        servings: generated.servings,
        difficulty: getDifficulty() as 'Easy' | 'Medium' | 'Hard',
        instructions: generated.instructions
      },
      ingredients
    };
  }
  
  // Fallback for regular food items (non-recipes) - no API call needed
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
  const router = useRouter()

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

  const handleStartCooking = (meal: FoodItem) => {
    router.push(`/cook/${meal.id}`)
  }

  // Filter meals based on completion status - always show uncompleted by default
  const uncompletedMeals = getUncompletedMeals()
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
        className="fixed inset-0 bg-gradient-to-br from-background via-blue-50/30 to-purple-50/30 z-40 flex flex-col relative overflow-hidden"
      >
        <AnimatedBubbles />
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
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-md relative z-10"
          >
            <motion.div 
              className="text-6xl mb-6"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0] 
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              🍽️
            </motion.div>
            <motion.h2 
              className="text-2xl font-bold mb-4 bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {completedMealsCount > 0 ? 'All meals cooked!' : (isReturningUser ? 'Ready to discover more?' : 'No favorites yet!')}
            </motion.h2>
            <p className="text-muted-foreground mb-8">
              {completedMealsCount > 0
                ? `Great job! You've cooked ${completedMealsCount} meals. Time to discover new recipes!`
                : (isReturningUser 
                  ? `You've explored ${userStats.totalRecipesGenerated} recipes so far. Let's find more delicious meals!`
                  : "Start swiping to discover meals you'll love and they'll appear here."
                )
              }
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={onStartOver} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <ChefHat className="h-5 w-5 mr-2" />
                </motion.div>
                Start Discovering
              </Button>
            </motion.div>
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
      className="fixed inset-0 bg-gradient-to-br from-background via-blue-50/20 to-purple-50/20 z-40 overflow-hidden"
    >
      <AnimatedBubbles />
      
      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-background/80 backdrop-blur-lg">
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
        <div className="flex-1 overflow-y-auto">
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
        <div className="p-4 border-t border-border/50 bg-background/90 backdrop-blur-xl">
          <div className="flex gap-4 justify-center max-w-md mx-auto">
          <motion.div 
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" onClick={onStartOver} className="w-full border-blue-200 hover:border-blue-300 hover:bg-blue-50/50">
              <ChefHat className="h-4 w-4 mr-2" />
              Find More
            </Button>
          </motion.div>
          <motion.div 
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Create Recipe
            </Button>
          </motion.div>
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
            onStartCooking={() => handleStartCooking(selectedMeal)}
          />
        )}
      </AnimatePresence>

      {/* Fixed Bottom Cooking Button - Only visible when modal is open */}
      <AnimatePresence>
        {selectedMeal && !loadingMeals.has(selectedMeal.id) && mealDataCache[selectedMeal.id] && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[110] px-6"
          >
            <div className="relative">
              <Button
                onClick={() => handleStartCooking(selectedMeal)}
                size="lg"
                className="h-16 px-8 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-2xl hover:shadow-3xl transition-all duration-300 group rounded-full"
              >
                <motion.div
                  className="flex items-center gap-3"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PlayCircle className="h-6 w-6 group-hover:animate-pulse" />
                  Start Cooking This Recipe
                  <ChefHat className="h-5 w-5" />
                </motion.div>
              </Button>
              {/* Enhanced glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full blur-xl -z-10 scale-125 animate-pulse"></div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
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
        scale: 1.03, 
        y: -4,
        transition: { duration: 0.1 }
      }}
      className="bg-card/90 backdrop-blur-md border border-border/50 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-100/50 cursor-pointer overflow-hidden transition-all duration-150 flex flex-col h-80 group"
      onClick={onClick}
    >
      {/* Card Image */}
      <div className={`h-32 flex items-center justify-center relative overflow-hidden ${isCompleted ? 'bg-gradient-to-br from-green-100/80 via-emerald-50/60 to-green-200/80' : 'bg-gradient-to-br from-orange-100/80 via-red-50/60 to-pink-100/80'} group-hover:scale-105 transition-transform duration-300`}>
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
        <motion.div 
          className="text-4xl opacity-90 relative z-10"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.05 }}
        >
          {isCompleted ? '✅' : (meal.category === 'recipe' ? '👨‍🍳' : '🍽️')}
        </motion.div>
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
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title and Action Buttons */}
        <div className="flex items-start gap-2 min-h-[3rem]">
          <h3 className={`text-base font-bold flex-1 leading-tight min-w-0 line-clamp-2 break-words ${isCompleted ? 'line-through opacity-60' : ''}`}>
            {meal.name}
          </h3>
          <div className="flex gap-1 flex-shrink-0">
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
        <div className="flex items-center justify-between gap-2 min-h-[1.5rem]">
          <Badge variant="secondary" className="text-xs px-2 py-1 truncate flex-shrink-0" style={{ maxWidth: '5rem' }}>
            {meal.category || 'food'}
          </Badge>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* <DollarSign className="h-3.5 w-3.5 text-green-600" /> */}
            <span className="font-bold text-green-600 text-sm whitespace-nowrap">
              ${displayPrice}
            </span>
          </div>
        </div>

        {/* Shop Name */}
        {meal.shopName && (
          <div className="flex items-center gap-1.5 min-h-[1rem]">
            <ShoppingBag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">
              {meal.shopName}
            </span>
          </div>
        )}

        {/* Spacer to push last row to bottom */}
        <div className="flex-grow"></div>
        
        {/* Time and Heart Row */}
        <div className="flex items-center justify-between min-h-[1rem]">
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {estimatedTime}min
            </span>
          </div>
          <Heart className="h-4 w-4 text-red-500 fill-current opacity-80 flex-shrink-0" />
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
  onStartCooking: () => void
}

function MealModal({ meal, mealData, isLoading, onClose, onRemove, onStartCooking }: MealModalProps) {
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
                {/* <DollarSign className="h-4 w-4 text-green-600" /> */}
                <span className="font-semibold text-green-600">${typeof meal.price === 'number' ? meal.price.toFixed(2) : '0.00'}</span>
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
            {/* <Button
              variant={meal.isCompleted ? "default" : "outline"}
              size="sm"
              onClick={onToggleCompleted}
              className={meal.isCompleted ? "bg-green-600 hover:bg-green-700" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
            >
              <Check className="h-4 w-4" />
              {meal.isCompleted ? "Cooked" : "Mark Cooked"}
            </Button> */}
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