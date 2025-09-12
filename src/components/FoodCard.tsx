'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, X, ShoppingBag, DollarSign } from 'lucide-react'
import { FoodItem, SwipeAction } from '@/types/food'
import { useState } from 'react'

interface FoodCardProps {
  foodItem: FoodItem
  onSwipe: (action: SwipeAction) => void
  isTop?: boolean
}

export default function FoodCard({ foodItem, onSwipe, isTop = false }: FoodCardProps) {
  const [isExiting, setIsExiting] = useState(false)
  
  // Drag controls
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // Transform drag distance to rotation and opacity
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  
  // Color overlays based on drag direction
  const likeOpacity = useTransform(x, [0, 100], [0, 0.5])
  const dislikeOpacity = useTransform(x, [-100, 0], [0.5, 0])

  const handleDragEnd = () => {
    const currentX = x.get()
    
    if (Math.abs(currentX) > 100) {
      setIsExiting(true)
      const action: SwipeAction = currentX > 0 ? 'like' : 'dislike'
      setTimeout(() => onSwipe(action), 200)
    }
  }

  const handleButtonAction = (action: SwipeAction) => {
    setIsExiting(true)
    
    // Animate card in the direction of the action
    if (action === 'like') {
      x.set(300)
    } else if (action === 'dislike') {
      x.set(-300)
    } else if (action === 'superlike') {
      y.set(-300)
    }
    
    setTimeout(() => onSwipe(action), 200)
  }

  return (
    <motion.div
      className={`absolute inset-0 ${isTop ? 'z-20' : 'z-10'} flex flex-col justify-center items-center`}
      style={{ x, y, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={isExiting ? { scale: 0.8 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileDrag={{ scale: 1.05, zIndex: 30 }}
    >
      <Card className="h-full bg-background shadow-2xl border-2 border-border relative overflow-hidden h-[80%] w-96">
        {/* Like Overlay */}
        <motion.div 
          className="absolute inset-0 bg-success/20 flex items-center justify-center z-10 pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <div className="border-4 border-success rounded-2xl px-8 py-4 rotate-12">
            <span className="text-4xl font-bold text-success">LIKE</span>
          </div>
        </motion.div>
        
        {/* Dislike Overlay */}
        <motion.div 
          className="absolute inset-0 bg-error/20 flex items-center justify-center z-10 pointer-events-none"
          style={{ opacity: dislikeOpacity }}
        >
          <div className="border-4 border-error rounded-2xl px-8 py-4 -rotate-12">
            <span className="text-4xl font-bold text-error">NOPE</span>
          </div>
        </motion.div>

        <CardContent className="p-0 h-full flex flex-col">
          {/* Food Image */}
          <div className="relative h-64 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="text-6xl opacity-30">🍽️</div>
            {!foodItem.isAvailable && (
              <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>

          {/* Food Info */}
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-2xl font-bold text-foreground line-clamp-2">
                {foodItem.name}
              </h3>
              <Badge variant="secondary" className="ml-2 shrink-0">
                {foodItem.category}
              </Badge>
            </div>

            {/* Price and Shop */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                <span className="text-2xl font-bold text-success">${foodItem.price}</span>
                <span className="text-muted-foreground">({foodItem.pricePerUnit})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{foodItem.shopName}</span>
            </div>

            {/* Nutrition Info */}
            {foodItem.nutritionInfo && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{foodItem.nutritionInfo.calories}</div>
                  <div className="text-sm text-muted-foreground">Calories</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-accent">{foodItem.nutritionInfo.protein}g</div>
                  <div className="text-sm text-muted-foreground">Protein</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-8 mt-auto">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => handleButtonAction('dislike')}
                disabled={!foodItem.isAvailable}
                className="h-20 w-20 rounded-full border-3 bg-gradient-to-br from-red-100 to-red-50 border-red-300 hover:border-red-500 hover:bg-red-500 hover:text-red-600 shadow-lg hover:shadow-xl hover:shadow-red-200 transition-all duration-300 backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-red-500 "
              >
                <X className="h-8 w-8" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleButtonAction('like')}
                disabled={!foodItem.isAvailable}
                className="h-20 w-20 rounded-full border-3 bg-gradient-to-br from-green-100 to-green-50 border-green-300 hover:border-green-500 hover:bg-green-500 shadow-lg hover:shadow-xl hover:shadow-green-200 transition-all duration-300 backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-green-500 hover:text-green-600"
              >
                <Heart className="h-8 w-8" />
              </motion.button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}