'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FoodCard from './FoodCard'
import { Button } from '@/components/ui/button'
import { RotateCcw, Check } from 'lucide-react'
import { FoodItem, SwipeAction } from '@/types/food'
import { useLikedMeals } from '@/contexts/LikedMealsContext'

interface FoodSwiperProps {
  foodItems: FoodItem[]
  onBack: () => void
  onShowLikedMeals: () => void
}

export default function FoodSwiper({ foodItems, onBack, onShowLikedMeals }: FoodSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { addLikedMeal, getLikedMealsCount } = useLikedMeals()

  const currentCard = foodItems[currentIndex]
  const nextCard = foodItems[currentIndex + 1]
  const isLastCard = currentIndex === foodItems.length - 1
  const likedCount = getLikedMealsCount()

  const handleSwipe = (action: SwipeAction) => {
    if (!currentCard) return

    if (action === 'like' || action === 'superlike') {
      addLikedMeal(currentCard)
    }

    if (isLastCard) {
      // Complete the swiping experience - show liked meals
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


  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 bg-background z-40 flex flex-col"
    >

      <div className="absolute inset-0 pointer-events-none">
                 {/* Animated Food Icons */}
                 <div className="absolute top-10 left-10 text-4xl opacity-20 animate-float" style={{ animationDelay: '0s', animationDuration: '8s' }}>🍕</div>
                 <div className="absolute top-32 right-16 text-3xl opacity-15 animate-float" style={{ animationDelay: '2s', animationDuration: '7s' }}>🍜</div>
                 <div className="absolute bottom-40 left-20 text-5xl opacity-25 animate-float" style={{ animationDelay: '1s', animationDuration: '9s' }}>🥗</div>
                 <div className="absolute bottom-20 right-12 text-3xl opacity-20 animate-float" style={{ animationDelay: '3s', animationDuration: '6s' }}>🍳</div>
                <div className="absolute top-1/2 left-8 text-2xl opacity-15 animate-float" style={{ animationDelay: '4s', animationDuration: '8s' }}>🥘</div>
                <div className="absolute top-1/4 right-8 text-4xl opacity-20 animate-float" style={{ animationDelay: '5s', animationDuration: '7s' }}>🍲</div>
                <div className="absolute bottom-1/3 right-1/4 text-3xl opacity-15 animate-float" style={{ animationDelay: '6s', animationDuration: '8s' }}>🥟</div>
                <div className="absolute top-3/4 left-1/3 text-2xl opacity-20 animate-float" style={{ animationDelay: '1.5s', animationDuration: '9s' }}>🍛</div>
      
                {/* Geometric Shapes */}
                <div className="absolute top-20 right-1/4 w-32 h-32 border border-primary/10 rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute bottom-32 left-1/4 w-24 h-24 border border-secondary/15 rounded-lg rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
                <div className="absolute top-1/2 right-20 w-16 h-16 bg-accent/5 rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
                <div className="absolute bottom-1/4 left-16 w-20 h-20 border-2 border-success/10 rotate-12 animate-bounce" style={{ animationDuration: '6s' }}></div>
      
                {/* Dots Pattern */}
                <div className="absolute top-16 left-1/2 w-2 h-2 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-48 left-1/3 w-3 h-3 bg-secondary/15 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
            <div className="absolute bottom-16 right-1/3 w-2 h-2 bg-accent/20 rounded-full animate-pulse" style={{ animationDelay: '4s' }}></div>
                 <div className="absolute bottom-48 right-1/2 w-3 h-3 bg-success/15 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
       
                 {/* Subtle Lines */}
                 <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent"></div>
                 <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-secondary/10 to-transparent"></div>
                 <div className="absolute left-0 top-1/3 w-full h-px bg-gradient-to-r from-transparent via-accent/10 to-transparent"></div>
               </div>

      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-background/80 backdrop-blur-lg z-50">
        <Button variant="secondary" size="sm" onClick={onBack} className="shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer">
          <RotateCcw className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
        
        <div className="text-center flex-1 mx-4">
          <div className="text-lg font-semibold">
            {currentIndex + 1} / {foodItems.length}
          </div>
          <div className="text-sm text-muted-foreground">
            {likedCount} liked
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
            {/* Next Card (Background) */}
            {nextCard && (
              <motion.div
                key={`next-${nextCard.id}`}
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 0.95, opacity: 0.8 }}
                className="absolute inset-0"
              >
                <FoodCard
                  foodItem={nextCard}
                  onSwipe={() => {}}
                  isTop={false}
                />
              </motion.div>
            )}

            {/* Current Card (Top) */}
            {currentCard && (
              <motion.div
                key={`current-${currentCard.id}`}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute inset-0 flex flex-col justify-center items-center"
              >
                <FoodCard
                  foodItem={currentCard}
                  onSwipe={handleSwipe}
                  isTop={true}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* No More Cards */}
          {!currentCard && !nextCard && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold mb-4">All done!</h2>
              <p className="text-lg text-muted-foreground mb-8">
                You've reviewed {foodItems.length} items and liked {likedCount}
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
      {currentCard && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-4 bg-muted/50 text-center text-sm text-muted-foreground"
        >
          Swipe right to like • Swipe left to pass
        </motion.div>
      )}
    </motion.div>
  )
}