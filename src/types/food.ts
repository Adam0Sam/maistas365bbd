export interface FoodItem {
  id: string
  name: string
  price: number
  url: string // Links to shop website
  image: string // Image URL
  pricePerUnit: string // e.g., "$2.50/lb", "$0.99/each"
  shopName: string
  isAvailable: boolean
  category?: string // Optional: e.g., "protein", "vegetable", "grain"
  nutritionInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
}

export interface Recipe {
  id: string
  name: string
  description: string
  cookTime: number // in minutes
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  ingredients: FoodItem[]
  instructions: string[]
  totalPrice: number
  image?: string
  tags: string[] // e.g., ["high-protein", "vegetarian", "quick"]
}

export type SwipeAction = 'like' | 'dislike' | 'superlike'

export interface SwipeResult {
  foodItem: FoodItem
  action: SwipeAction
}