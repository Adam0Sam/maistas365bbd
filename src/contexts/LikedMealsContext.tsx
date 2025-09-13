'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { FoodItem } from '@/types/food'

interface LikedMealsContextType {
  likedMeals: FoodItem[]
  addLikedMeal: (meal: FoodItem) => void
  removeLikedMeal: (mealId: string) => void
  clearLikedMeals: () => void
  getLikedMealsCount: () => number
  markAsCompleted: (mealId: string) => void
  markAsIncomplete: (mealId: string) => void
  getUncompletedMeals: () => FoodItem[]
  getCompletedMeals: () => FoodItem[]
}

const LikedMealsContext = createContext<LikedMealsContextType | undefined>(undefined)

const STORAGE_KEY = 'likedMeals'

export function LikedMealsProvider({ children }: { children: ReactNode }) {
  const [likedMeals, setLikedMeals] = useState<FoodItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    console.log('stored: ', stored)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setLikedMeals(parsed)
      } catch (error) {
        console.error('Failed to load liked meals from storage:', error)
      }
    }
  }, [])

  // Save to localStorage whenever likedMeals changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likedMeals))
  }, [likedMeals])

  const addLikedMeal = (meal: FoodItem) => {
    setLikedMeals(prev => {
      // Avoid duplicates
      if (prev.find(m => m.id === meal.id)) {
        return prev
      }
      // Add with isCompleted defaulted to false
      return [...prev, { ...meal, isCompleted: false }]
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

  const markAsCompleted = (mealId: string) => {
    setLikedMeals(prev => 
      prev.map(meal => 
        meal.id === mealId ? { ...meal, isCompleted: true } : meal
      )
    )
  }

  const markAsIncomplete = (mealId: string) => {
    setLikedMeals(prev => 
      prev.map(meal => 
        meal.id === mealId ? { ...meal, isCompleted: false } : meal
      )
    )
  }

  const getUncompletedMeals = () => {
    return likedMeals.filter(meal => !meal.isCompleted)
  }

  const getCompletedMeals = () => {
    return likedMeals.filter(meal => meal.isCompleted)
  }

  const value: LikedMealsContextType = {
    likedMeals,
    addLikedMeal,
    removeLikedMeal,
    clearLikedMeals,
    getLikedMealsCount,
    markAsCompleted,
    markAsIncomplete,
    getUncompletedMeals,
    getCompletedMeals,
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