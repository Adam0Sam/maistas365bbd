'use client'

import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Heart, X, ShoppingBag, Users } from 'lucide-react'
import { SwipeAction } from '@/types/food'
import { GeneratedRecipe } from '@/lib/generateAndParse'
import { useState, useRef } from 'react'

interface RecipeCardProps {
  recipe: GeneratedRecipe
  onSwipe: (action: SwipeAction) => void
  isTop?: boolean
}

export default function RecipeCard({ recipe, onSwipe, isTop = false }: RecipeCardProps) {
  const [isExiting, setIsExiting] = useState(false)
  const controls = useAnimation()
  const constraintsRef = useRef(null)
  
  // Drag controls
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // Transform ranges for animation
  const rotate = useTransform(x, [-300, 0, 300], [-30, 0, 30])
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 0.7, 1, 0.7, 0])
  
  // Overlay animations
  const likeOpacity = useTransform(x, [0, 50, 150], [0, 0.3, 0.7])
  const dislikeOpacity = useTransform(x, [-150, -50, 0], [0.7, 0.3, 0])
  const likeScale = useTransform(x, [0, 100, 200], [0.8, 1, 1.1])
  const dislikeScale = useTransform(x, [-200, -100, 0], [1.1, 1, 0.8])
  
  // Dynamic border color
  const borderColor = useTransform(x, [-150, -50, 0, 50, 150], 
    ['rgb(239, 68, 68)', 'rgb(156, 163, 175)', 'rgb(156, 163, 175)', 'rgb(34, 197, 94)', 'rgb(34, 197, 94)'])
  const borderWidth = useTransform(x, [-150, -50, 0, 50, 150], [4, 2, 2, 2, 4])

  // No cost calculation in new simplified schema

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentX = x.get()
    const velocity = info.velocity.x
    const dragDistance = Math.abs(currentX)
    const velocityThreshold = 500
    
    const shouldSwipe = dragDistance > 100 || Math.abs(velocity) > velocityThreshold
    
    if (shouldSwipe) {
      setIsExiting(true)
      const action: SwipeAction = currentX > 0 || velocity > 0 ? 'like' : 'dislike'
      
      const exitX = action === 'like' ? 500 : -500
      const exitRotate = action === 'like' ? 45 : -45
      
      controls.start({
        x: exitX,
        y: Math.abs(velocity) > velocityThreshold ? -100 : 0,
        rotate: exitRotate,
        opacity: 0,
        scale: 0.8,
        transition: {
          type: 'spring',
          stiffness: 120,
          damping: 30,
          duration: 3.2
        }
      })
      
      setTimeout(() => onSwipe(action), 200)
    } else {
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 30,
          mass: 0.8
        }
      })
    }
  }

  const handleButtonAction = (action: SwipeAction) => {
    setIsExiting(true)
    
    if (action === 'like') {
      controls.start({
        x: 500,
        rotate: 30,
        opacity: 0,
        scale: 0.8,
        transition: { type: 'spring', stiffness: 80, damping: 25, duration: 2.2 }
      })
    } else if (action === 'dislike') {
      controls.start({
        x: -500,
        rotate: -30,
        opacity: 0,
        scale: 0.8,
        transition: { type: 'spring', stiffness: 80, damping: 25, duration: 2.2 }
      })
    }
    
    setTimeout(() => onSwipe(action), 500)
  }

  return (
    <motion.div
      ref={constraintsRef}
      className={`absolute inset-0 ${isTop ? 'z-20' : 'z-10'} flex flex-col justify-center items-center cursor-grab`}
      style={{ x, y, rotate, opacity }}
      animate={controls}
      drag={!isExiting}
      dragConstraints={{
        left: -300,
        right: 300,
        top: -100,
        bottom: 100
      }}
      dragElastic={0.2}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileDrag={{ 
        scale: 1.05, 
        zIndex: 30,
        cursor: 'grabbing'
      }}
      initial={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <motion.div
        className="bg-background shadow-2xl border-2 relative overflow-hidden h-[85%] w-96 rounded-lg"
        style={{ 
          borderColor, 
          borderWidth,
          boxShadow: useTransform(x, 
            [-150, 0, 150], 
            ['0 20px 25px -5px rgba(239, 68, 68, 0.3), 0 10px 10px -5px rgba(239, 68, 68, 0.1)', 
             '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
             '0 20px 25px -5px rgba(34, 197, 94, 0.3), 0 10px 10px -5px rgba(34, 197, 94, 0.1)'])
        }}
      >
        {/* Like Overlay */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ 
            opacity: likeOpacity,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(16, 185, 129, 0.6), rgba(5, 150, 105, 0.4))'
          }}
        >
          <motion.div 
            className="border-4 border-white rounded-2xl px-8 py-4 rotate-12 bg-white/20 backdrop-blur-sm shadow-xl"
            style={{ scale: likeScale }}
          >
            <span className="text-5xl font-black text-white drop-shadow-2xl tracking-wide">COOK</span>
          </motion.div>
        </motion.div>
        
        {/* Dislike Overlay */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ 
            opacity: dislikeOpacity,
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.6), rgba(185, 28, 28, 0.4))'
          }}
        >
          <motion.div 
            className="border-4 border-white rounded-2xl px-8 py-4 -rotate-12 bg-white/20 backdrop-blur-sm shadow-xl"
            style={{ scale: dislikeScale }}
          >
            <span className="text-5xl font-black text-white drop-shadow-2xl tracking-wide">SKIP</span>
          </motion.div>
        </motion.div>

        <div className="p-0 h-full flex flex-col">
          {/* Recipe Image/Header */}
          <div className="relative h-48 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
            <div className="text-6xl opacity-60">🍳</div>
          </div>

          {/* Recipe Info */}
          <div className="p-6 flex-1 flex flex-col overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                {recipe.title}
              </h3>
              {recipe.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {recipe.description}
                </p>
              )}
            </div>

            {/* Recipe Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-3 w-3 text-blue-500" />
                  <span className="text-sm font-bold text-blue-500">{recipe.servings}</span>
                </div>
                <div className="text-xs text-muted-foreground">Servings</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ShoppingBag className="h-3 w-3 text-purple-500" />
                  <span className="text-sm font-bold text-purple-500">{recipe.ingredients.length}</span>
                </div>
                <div className="text-xs text-muted-foreground">Ingredients</div>
              </div>
            </div>

            {/* Ingredients Preview */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Key Ingredients:</h4>
              <div className="flex flex-wrap gap-1">
                {recipe.ingredients.slice(0, 4).map((ingredient, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {ingredient.name}
                  </Badge>
                ))}
                {recipe.ingredients.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{recipe.ingredients.length - 4} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Cooking Steps Preview */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-2">Steps:</h4>
              <div className="text-xs text-muted-foreground">
                {recipe.instructions.length} cooking steps
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-8 mt-auto">
              <motion.button
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => handleButtonAction('dislike')}
                className="h-16 w-16 rounded-full border-3 bg-gradient-to-br from-red-100 to-red-50 border-red-300 hover:border-red-500 hover:bg-red-500 hover:text-red-600 shadow-lg hover:shadow-xl hover:shadow-red-200 transition-all duration-300 backdrop-blur-sm flex items-center justify-center text-red-500 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleButtonAction('like')}
                className="h-16 w-16 rounded-full border-3 bg-gradient-to-br from-green-100 to-green-50 border-green-300 hover:border-green-500 hover:bg-green-500 shadow-lg hover:shadow-xl hover:shadow-green-200 transition-all duration-300 backdrop-blur-sm flex items-center justify-center text-green-500 hover:text-green-600 cursor-pointer"
              >
                <Heart className="h-6 w-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}