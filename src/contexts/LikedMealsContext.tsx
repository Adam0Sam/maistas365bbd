'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { FoodItem } from '@/types/food'

interface LikedMealsContextType {
  likedMeals: FoodItem[]
  addLikedMeal: (meal: FoodItem) => void
  removeLikedMeal: (mealId: string) => void
  clearLikedMeals: () => void
  getLikedMealsCount: () => number
}

const LikedMealsContext = createContext<LikedMealsContextType | undefined>(undefined)

export function LikedMealsProvider({ children }: { children: ReactNode }) {
  const [likedMeals, setLikedMeals] = useState<FoodItem[]>([])

  const addLikedMeal = (meal: FoodItem) => {
    setLikedMeals(prev => {
      // Avoid duplicates
      if (prev.find(m => m.id === meal.id)) {
        return prev
      }
      return [...prev, meal]
    })
  }

  const removeLikedMeal = (mealId: string) => {
    setLikedMeals(prev => prev.filter(meal => meal.id !== mealId))
  }

  const clearLikedMeals = () => {
    setLikedMeals([])
  }

  const getLikedMealsCount = () => {
    return likedMeals.length
  }

  const value: LikedMealsContextType = {
    likedMeals,
    addLikedMeal,
    removeLikedMeal,
    clearLikedMeals,
    getLikedMealsCount,
  }

  return (
    <LikedMealsContext.Provider value={value}>
      {children}
    </LikedMealsContext.Provider>
  )
}

export function useLikedMeals() {
  const context = useContext(LikedMealsContext)
  if (context === undefined) {
    throw new Error('useLikedMeals must be used within a LikedMealsProvider')
  }
  return context
}