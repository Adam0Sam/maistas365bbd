import { GeneratedRecipe } from "@/lib/generateAndParse"
import { StepGraph } from "@/lib/parse-full-recipe"

// Basic recipe info that comes from initial batch generation (without ingredients)
export interface BasicRecipeInfo {
  title: string
  description: string
  servings: number
  instructions: string[]
}

// Full recipe with ingredients and shopping plan
export interface FullRecipeData {
  generated: GeneratedRecipe
  plan: RecipePlan
  graph?: StepGraph // Optional parallel cooking tracks
}

export interface FoodItem {
  id: string
  name: string
  url: string // Links to shop website
  image: string // Image URL
  price: number // Add price field
  shopName?: string // Add shop name field
  isAvailable: boolean
  isCompleted?: boolean // Track if meal has been cooked
  category?: string // Optional: e.g., "protein", "vegetable", "grain", "recipe"
  nutritionInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  // Basic recipe info from initial batch (for recipes without ingredients)
  basicRecipe?: BasicRecipeInfo
  // Full recipe data with ingredients and shopping plan (loaded separately)
  recipeData?: FullRecipeData
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

// New types for AI-generated recipes
export interface AIGeneratedIngredient {
  name: string
  quantity: string
  search_description?: string
}

export interface AIGeneratedRecipe {
  title: string
  description: string
  servings: number
  ingredients: AIGeneratedIngredient[]
  instructions: string[]
}

export interface ShoppingListItem {
  ingredient: string
  chosen_product: {
    productId: string
    name: string
    price: number
    shop: string
  }
}

export interface RecipePlan {
  ingredients: AIGeneratedIngredient[]
  candidates: Record<string, any[]>
  shopping_list: ShoppingListItem[]
}

export type SwipeAction = 'like' | 'dislike' | 'superlike'

export interface SwipeResult {
  foodItem: FoodItem
  action: SwipeAction
}