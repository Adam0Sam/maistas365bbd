'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RecipeCard from './RecipeCard'
import { Button } from '@/components/ui/button'
import { RotateCcw, Check } from 'lucide-react'
import { SwipeAction } from '@/types/food'
import { PlannedRecipeResult } from '@/lib/generateAndParse'
import { useLikedMeals } from '@/contexts/LikedMealsContext'

interface RecipeSwiperProps {
  recipes: PlannedRecipeResult[]
  onBack: () => void
  onShowLikedMeals: () => void
}

export default function RecipeSwiper({ recipes, onBack, onShowLikedMeals }: RecipeSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { addLikedMeal, getLikedMealsCount } = useLikedMeals()

  // Filter successful recipes
  const successfulRecipes = recipes.filter((recipe): recipe is PlannedRecipeResult & { ok: true } => recipe.ok)
  const currentRecipe = successfulRecipes[currentIndex]
  const nextRecipe = successfulRecipes[currentIndex + 1]
  const isLastRecipe = currentIndex === successfulRecipes.length - 1
  const likedCount = getLikedMealsCount()

  const handleSwipe = (action: SwipeAction) => {
    if (!currentRecipe) return

    if (action === 'like' || action === 'superlike') {
      // Convert recipe to FoodItem format for the liked meals context
      const recipeAsFoodItem = {
        id: `recipe-${currentRecipe.title}-${Date.now()}`,
        name: currentRecipe.title,
        price: currentRecipe.plan.shopping_list.reduce((sum, item) => sum + item.chosen_product.price, 0),
        url: '#',
        image: '/placeholder-recipe.jpg',
        pricePerUnit: `$${(currentRecipe.plan.shopping_list.reduce((sum, item) => sum + item.chosen_product.price, 0) / currentRecipe.generated.servings).toFixed(2)} per serving`,
        shopName: Array.from(new Set(currentRecipe.plan.shopping_list.map(item => item.chosen_product.shop))).join(', '),
        isAvailable: true,
        category: 'recipe'
      }
      addLikedMeal(recipeAsFoodItem)
    }

    if (isLastRecipe) {
      setTimeout(() => {
        onShowLikedMeals()
      }, 300)
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
  }

  if (successfulRecipes.length === 0) {
    return (
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-0 bg-background z-40 flex flex-col items-center justify-center"
      >
        <div className="text-6xl mb-6">😞</div>
        <h2 className="text-2xl font-bold mb-4">No Recipes Available</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          We couldn't generate any recipes with your request. Please try a different search query.
        </p>
        <Button onClick={onBack}>Try Again</Button>
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
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated Food Icons */}
        <div className="absolute top-10 left-10 text-4xl opacity-20 animate-float" style={{ animationDelay: '0s', animationDuration: '8s' }}>🍳</div>
        <div className="absolute top-32 right-16 text-3xl opacity-15 animate-float" style={{ animationDelay: '2s', animationDuration: '7s' }}>👨‍🍳</div>
        <div className="absolute bottom-40 left-20 text-5xl opacity-25 animate-float" style={{ animationDelay: '1s', animationDuration: '9s' }}>🥘</div>
        <div className="absolute bottom-20 right-12 text-3xl opacity-20 animate-float" style={{ animationDelay: '3s', animationDuration: '6s' }}>📖</div>
        <div className="absolute top-1/2 left-8 text-2xl opacity-15 animate-float" style={{ animationDelay: '4s', animationDuration: '8s' }}>🍽️</div>
        <div className="absolute top-1/4 right-8 text-4xl opacity-20 animate-float" style={{ animationDelay: '5s', animationDuration: '7s' }}>🥗</div>

        {/* Geometric Shapes */}
        <div className="absolute top-20 right-1/4 w-32 h-32 border border-primary/10 rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 border border-secondary/15 rounded-lg rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>

      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-background/80 backdrop-blur-lg z-50">
        <Button variant="secondary" size="sm" onClick={onBack} className="shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer">
          <RotateCcw className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
        
        <div className="text-center flex-1 mx-4">
          <div className="text-lg font-semibold">
            Recipe {currentIndex + 1} / {successfulRecipes.length}
          </div>
          <div className="text-sm text-muted-foreground">
            {likedCount} favorites
          </div>
        </div>

        <Button variant="default" size="sm" onClick={onShowLikedMeals} className="shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer">
          <Check className="h-4 w-4 mr-2" />
          Done ({likedCount})
        </Button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 relative p-4 max-w-md mx-auto w-full">
        <div className="relative h-full">
          <AnimatePresence>
            {/* Next Recipe (Background) */}
            {nextRecipe && (
              <motion.div
                key={`next-${nextRecipe.title}`}
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 0.95, opacity: 0.8 }}
                className="absolute inset-0"
              >
                <RecipeCard
                  recipe={nextRecipe}
                  onSwipe={() => {}}
                  isTop={false}
                />
              </motion.div>
            )}

            {/* Current Recipe (Top) */}
            {currentRecipe && (
              <motion.div
                key={`current-${currentRecipe.title}`}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute inset-0 flex flex-col justify-center items-center"
              >
                <RecipeCard
                  recipe={currentRecipe}
                  onSwipe={handleSwipe}
                  isTop={true}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* No More Recipes */}
          {!currentRecipe && !nextRecipe && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold mb-4">All recipes reviewed!</h2>
              <p className="text-lg text-muted-foreground mb-8">
                You've reviewed {successfulRecipes.length} recipes and saved {likedCount} favorites
              </p>
              <div className="flex gap-4">
                <Button onClick={handleReset} variant="outline">
                  Review Again
                </Button>
                <Button onClick={onShowLikedMeals}>
                  View Favorites
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {currentRecipe && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-4 bg-muted/50 text-center text-sm text-muted-foreground"
        >
          Swipe right to save recipe • Swipe left to skip
        </motion.div>
      )}
    </motion.div>
  )
}