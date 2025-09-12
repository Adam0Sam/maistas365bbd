'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, ShoppingBag, DollarSign, Trash2, ChefHat, Clock, Users, X } from 'lucide-react'
import { useLikedMeals } from '@/contexts/LikedMealsContext'
import { FoodItem } from '@/types/food'
import { useState, useEffect } from 'react'
import { getUserState, shouldShowLandingPage } from '@/lib/localStorage'

interface LikedMealsProps {
  onBack: () => void
  onStartOver: () => void
}

// Extended meal data with recipe info (normally would come from API)
const getMealData = (meal: FoodItem) => ({
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
    { name: 'Black Pepper', amount: '1/2 tsp', price: 0.15, category: 'seasoning' },
    { name: 'Garlic', amount: '3 cloves', price: 0.75, category: 'vegetable' },
    { name: 'Onion', amount: '1 medium', price: 1.25, category: 'vegetable' }
  ]
})

export default function LikedMeals({ onBack, onStartOver }: LikedMealsProps) {
  const { likedMeals, removeLikedMeal, clearLikedMeals } = useLikedMeals()
  const [selectedMeal, setSelectedMeal] = useState<FoodItem | null>(null)
  const [userStats, setUserStats] = useState({ totalRecipesGenerated: 0, totalRecipesLiked: 0 })
  const [isReturningUser, setIsReturningUser] = useState(false)

  useEffect(() => {
    const stats = getUserState()
    setUserStats({
      totalRecipesGenerated: stats.totalRecipesGenerated,
      totalRecipesLiked: stats.totalRecipesLiked
    })
    setIsReturningUser(!shouldShowLandingPage())
  }, [])

  const handleCardClick = (meal: FoodItem) => {
    setSelectedMeal(meal)
  }

  const handleCloseModal = () => {
    setSelectedMeal(null)
  }

  if (likedMeals.length === 0) {
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
              {isReturningUser ? 'Ready to discover more?' : 'No favorites yet!'}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isReturningUser 
                ? `You've explored ${userStats.totalRecipesGenerated} recipes so far. Let's find more delicious meals!`
                : "Start swiping to discover meals you'll love and they'll appear here."
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
            {isReturningUser ? 'Welcome Back!' : 'Your Favorites'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {likedMeals.length} saved • {userStats.totalRecipesGenerated} recipes explored
          </p>
        </div>

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

      {/* Grid Layout */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/95">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {likedMeals.map((meal, index) => (
                <GridMealCard
                  key={meal.id}
                  meal={meal}
                  index={index}
                  onClick={() => handleCardClick(meal)}
                  onRemove={() => removeLikedMeal(meal.id)}
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
            mealData={getMealData(selectedMeal)}
            onClose={handleCloseModal}
            onRemove={() => {
              removeLikedMeal(selectedMeal.id)
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
}

function GridMealCard({ meal, index, onClick, onRemove }: GridMealCardProps) {
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
      <div className="h-32 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center relative">
        <div className="text-4xl opacity-80">
          {meal.category === 'recipe' ? '👨‍🍳' : '🍽️'}
        </div>
        {meal.category === 'recipe' && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs bg-white/80 backdrop-blur-sm">
              Recipe
            </Badge>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Title and Remove Button */}
        <div className="flex items-start gap-2">
          <h3 className="text-lg font-bold line-clamp-2 flex-1 leading-tight">
            {meal.name}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="p-1.5 rounded-full hover:bg-red-100 text-red-500 opacity-60 hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-0.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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
  mealData: ReturnType<typeof getMealData>
  onClose: () => void
  onRemove: () => void
}

function MealModal({ meal, mealData, onClose, onRemove }: MealModalProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalIngredientPrice = mealData.ingredients.reduce((sum, ing) => sum + ing.price, 0)

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

        {/* Modal Content */}
        <div className="p-6 space-y-6">
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
              {mealData.ingredients.map((ingredient, idx) => (
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