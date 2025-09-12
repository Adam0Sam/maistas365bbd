'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, ShoppingBag, DollarSign, Trash2, ChefHat, Clock, Users, Star } from 'lucide-react'
import { useLikedMeals } from '@/contexts/LikedMealsContext'
import { FoodItem } from '@/types/food'
import { useState, useRef, useEffect } from 'react'

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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleCardHover = (mealId: string) => {
    setHoveredCard(mealId)
  }

  const handleCardLeave = () => {
    setHoveredCard(null)
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
            <h2 className="text-2xl font-bold mb-4">No favorites yet!</h2>
            <p className="text-muted-foreground mb-8">
              Start swiping to discover meals you&apos;ll love and they&apos;ll appear here.
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
          <h1 className="text-xl font-bold">Your Favorites</h1>
          <p className="text-sm text-muted-foreground">{likedMeals.length} meals</p>
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

      {/* Stacked Cards Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/95">
        <div className="max-w-4xl mx-auto p-6 relative min-h-[600px]">
          <div className="relative">
            <AnimatePresence>
              {likedMeals.map((meal, index) => (
                <StackedMealCard 
                  key={meal.id} 
                  meal={meal} 
                  mealData={getMealData(meal)}
                  index={index}
                  isHovered={hoveredCard === meal.id}
                  hasHoveredCard={hoveredCard !== null}
                  onHover={handleCardHover}
                  onLeave={handleCardLeave}
                  onRemove={removeLikedMeal}
                  totalCards={likedMeals.length}
                  allMeals={likedMeals}
                  hoveredCard={hoveredCard}
                  scrollContainerRef={scrollContainerRef}
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
    </motion.div>
  )
}

interface StackedMealCardProps {
  meal: FoodItem
  mealData: ReturnType<typeof getMealData>
  index: number
  isHovered: boolean
  hasHoveredCard: boolean
  onHover: (id: string) => void
  onLeave: () => void
  onRemove: (id: string) => void
  totalCards: number
  allMeals: FoodItem[]
  hoveredCard: string | null
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

function StackedMealCard({ 
  meal, 
  mealData, 
  index, 
  isHovered, 
  hasHoveredCard,
  onHover, 
  onLeave,
  onRemove,
  allMeals,
  hoveredCard,
  scrollContainerRef
}: StackedMealCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalIngredientPrice = mealData.ingredients.reduce((sum, ing) => sum + ing.price, 0)
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  const baseOffset = index * 120 // Each card is offset by 120px from the previous
  
  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight
      setContentHeight(height)
    }
  }, [meal.id, contentRef.current?.scrollHeight])
  
  // Auto-scroll to show full card when hovered
  useEffect(() => {
    if (isHovered && cardRef.current && scrollContainerRef.current) {
      const card = cardRef.current
      const container = scrollContainerRef.current
      
      // Wait for expansion animation to complete
      setTimeout(() => {
        // Get the card's position in the document
        const cardRect = card.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        
        // Calculate the card's position relative to the container
        const cardTopRelativeToContainer = cardRect.top - containerRect.top
        const cardBottomRelativeToContainer = cardRect.bottom - containerRect.top
        
        // Check if card is fully visible
        const isCardTopVisible = cardTopRelativeToContainer >= 0
        const isCardBottomVisible = cardBottomRelativeToContainer <= container.clientHeight
        
        // If card is not fully visible, scroll to show it
        if (!isCardTopVisible || !isCardBottomVisible) {
          // Calculate target scroll position to center the card with some padding
          const cardCenterY = (cardRect.top + cardRect.bottom) / 2
          const containerCenterY = containerRect.top + (container.clientHeight / 2)
          const scrollOffset = cardCenterY - containerCenterY
          
          container.scrollBy({
            top: scrollOffset,
            behavior: 'smooth'
          })
        }
      }, 320) // Wait a bit longer for expansion
    }
  }, [isHovered])
  
  const getTransform = () => {
    if (!hasHoveredCard) return 0 // No cards hovered
    
    if (isHovered) return 0 // This card is hovered, stay in place
    
    // Find the hovered card index
    const hoveredIndex = meal.id === hoveredCard ? index : allMeals.findIndex(m => m.id === hoveredCard)
    
    if (index < hoveredIndex) {
      // Cards above the hovered card move up more
      return -300
    } else {
      // Cards below the hovered card move down more  
      return 400
    }
  }
  
  return (
    <motion.div
      ref={cardRef}
      className="absolute w-full"
      style={{ 
        zIndex: isHovered ? 999 : index + 1, // Hovered card gets highest z-index
        top: baseOffset
      }}
      animate={{
        y: getTransform(),
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 25,
        duration: 0.5
      }}
      onMouseEnter={() => onHover(meal.id)}
      onMouseLeave={onLeave}
    >
      <motion.div
        className={`bg-card border border-border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-visible cursor-pointer ${
          isHovered ? 'max-w-4xl w-full max-h-[90vh] overflow-y-auto' : 'overflow-hidden'
        }`}
      >
        {/* Always Visible Top Section */}
        <div className="flex items-center p-6 h-[160px]">
          {/* Meal Image */}
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center flex-shrink-0 mr-4">
            <div className="text-2xl">🍽️</div>
          </div>

          {/* Meal Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold line-clamp-1">{meal.name}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(meal.id)
                }}
                className="p-1 rounded-full hover:bg-red-100 text-red-500 opacity-70 hover:opacity-100 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="text-xs">{meal.category}</Badge>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="font-semibold text-green-600">${meal.price}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{mealData.recipe.cookTime}min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{mealData.recipe.servings} servings</span>
              </div>
              <Badge className={`text-xs px-2 py-0.5 ${getDifficultyColor(mealData.recipe.difficulty)}`}>
                {mealData.recipe.difficulty}
              </Badge>
            </div>
          </div>

          <Heart className="h-5 w-5 text-red-500 fill-current ml-2 flex-shrink-0" />
        </div>

        {/* Expandable Content */}
        <motion.div
          animate={{ 
            opacity: isHovered ? 1 : 0,
            height: isHovered ? contentHeight : 0
          }}
          transition={{ 
            duration: 0.4,
            ease: [0.04, 0.62, 0.23, 0.98] // Custom easing for smooth feel
          }}
          className="border-t border-border overflow-hidden"
        >
          <div ref={contentRef} className="p-6 space-y-6">
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
                  <div key={idx} className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
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
              <ol className="space-y-2">
                {mealData.recipe.instructions.map((step, idx) => (
                  <li key={idx} className="text-sm flex gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
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
    </motion.div>
  )
}