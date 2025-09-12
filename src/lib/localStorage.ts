import { PlannedRecipeResult } from '@/lib/generateAndParse'

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__'
    if (typeof window === 'undefined') return false
    window.localStorage.setItem(testKey, 'test')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

const STORAGE_KEYS = {
  RECIPES: 'maistas365_recipes',
  USER_STATE: 'maistas365_user_state',
  LIKED_MEALS: 'maistas365_liked_meals'
} as const

export interface UserState {
  isFirstVisit: boolean
  lastVisitDate: string
  totalRecipesGenerated: number
  totalRecipesLiked: number
}

// Recipe storage functions
export const saveRecipesToStorage = (recipes: PlannedRecipeResult[]): void => {
  if (!isLocalStorageAvailable()) return
  
  try {
    const existingRecipes = getRecipesFromStorage()
    const allRecipes = [...existingRecipes, ...recipes]
    
    // Keep only the last 50 recipes to avoid storage bloat
    const recentRecipes = allRecipes.slice(-50)
    
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recentRecipes))
  } catch (error) {
    console.warn('Failed to save recipes to localStorage:', error)
  }
}

export const getRecipesFromStorage = (): PlannedRecipeResult[] => {
  if (!isLocalStorageAvailable()) return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECIPES)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn('Failed to load recipes from localStorage:', error)
    return []
  }
}

export const clearRecipesFromStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.RECIPES)
  } catch (error) {
    console.warn('Failed to clear recipes from localStorage:', error)
  }
}

// User state functions
export const getUserState = (): UserState => {
  const defaultState: UserState = {
    isFirstVisit: true,
    lastVisitDate: new Date().toISOString(),
    totalRecipesGenerated: 0,
    totalRecipesLiked: 0
  }
  
  if (!isLocalStorageAvailable()) return defaultState
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_STATE)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load user state from localStorage:', error)
  }
  
  return defaultState
}

export const updateUserState = (updates: Partial<UserState>): void => {
  if (!isLocalStorageAvailable()) return
  
  try {
    const currentState = getUserState()
    const newState: UserState = {
      ...currentState,
      ...updates,
      lastVisitDate: new Date().toISOString()
    }
    
    localStorage.setItem(STORAGE_KEYS.USER_STATE, JSON.stringify(newState))
  } catch (error) {
    console.warn('Failed to update user state in localStorage:', error)
  }
}

export const markUserAsReturning = (): void => {
  updateUserState({ isFirstVisit: false })
}

export const incrementRecipesGenerated = (count: number = 1): void => {
  const currentState = getUserState()
  updateUserState({ 
    totalRecipesGenerated: currentState.totalRecipesGenerated + count 
  })
}

export const incrementRecipesLiked = (count: number = 1): void => {
  const currentState = getUserState()
  updateUserState({ 
    totalRecipesLiked: currentState.totalRecipesLiked + count 
  })
}

// Utility to check if user should see landing page or liked meals
export const shouldShowLandingPage = (): boolean => {
  const userState = getUserState()
  return userState.isFirstVisit
}

// Clear all storage (useful for testing or reset functionality)
export const clearAllStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.warn('Failed to clear all storage:', error)
  }
}