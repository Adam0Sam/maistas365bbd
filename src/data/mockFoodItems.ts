import { FoodItem } from '@/types/food'

export const mockFoodItems: FoodItem[] = [
  {
    id: '1',
    name: 'Organic Chicken Breast',
    price: 12.99,
    url: 'https://whole-foods.com/chicken-breast',
    image: '/api/placeholder/400/300',
    pricePerUnit: '$4.33/lb',
    shopName: 'Whole Foods Market',
    isAvailable: true,
    category: 'protein',
    nutritionInfo: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6
    }
  },
  {
    id: '2',
    name: 'Fresh Broccoli Crowns',
    price: 3.49,
    url: 'https://kroger.com/broccoli',
    image: '/api/placeholder/400/300',
    pricePerUnit: '$2.99/lb',
    shopName: 'Kroger',
    isAvailable: true,
    category: 'vegetable',
    nutritionInfo: {
      calories: 25,
      protein: 3,
      carbs: 5,
      fat: 0.3
    }
  },
  {
    id: '3',
    name: 'Brown Rice (Organic)',
    price: 4.99,
    url: 'https://target.com/brown-rice',
    image: '/api/placeholder/400/300',
    pricePerUnit: '$0.31/oz',
    shopName: 'Target',
    isAvailable: true,
    category: 'grain',
    nutritionInfo: {
      calories: 216,
      protein: 5,
      carbs: 45,
      fat: 1.8
    }
  },
  {
    id: '4',
    name: 'Atlantic Salmon Fillet',
    price: 18.99,
    url: 'https://whole-foods.com/salmon',
    image: '/api/placeholder/400/300',
    pricePerUnit: '$12.66/lb',
    shopName: 'Whole Foods Market',
    isAvailable: false,
    category: 'protein',
    nutritionInfo: {
      calories: 208,
      protein: 22,
      carbs: 0,
      fat: 12
    }
  },
  {
    id: '5',
    name: 'Sweet Potatoes',
    price: 2.99,
    url: 'https://walmart.com/sweet-potatoes',
    image: '/api/placeholder/400/300',
    pricePerUnit: '$1.99/lb',
    shopName: 'Walmart',
    isAvailable: true,
    category: 'vegetable',
    nutritionInfo: {
      calories: 86,
      protein: 2,
      carbs: 20,
      fat: 0.1
    }
  },
  {
    id: '6',
    name: 'Greek Yogurt (Plain)',
    price: 5.49,
    url: 'https://safeway.com/greek-yogurt',
    image: '/api/placeholder/400/300',
    pricePerUnit: '$0.34/oz',
    shopName: 'Safeway',
    isAvailable: true,
    category: 'dairy',
    nutritionInfo: {
      calories: 100,
      protein: 17,
      carbs: 6,
      fat: 0
    }
  },
  {
    id: '7',
    name: 'Quinoa (Tri-Color)',
    price: 8.99,
    url: 'https://whole-foods.com/quinoa',
    image: '/api/placeholder/400/300',
    pricePerUnit: '$0.56/oz',
    shopName: 'Whole Foods Market',
    isAvailable: true,
    category: 'grain',
    nutritionInfo: {
      calories: 222,
      protein: 8,
      carbs: 39,
      fat: 3.6
    }
  },
  {
    id: '8',
    name: 'Avocados (Hass)',
    price: 6.99,
    url: 'https://kroger.com/avocados',
    image: '/api/placeholder/400/300',
    pricePerUnit: '$1.75/each',
    shopName: 'Kroger',
    isAvailable: true,
    category: 'fruit',
    nutritionInfo: {
      calories: 234,
      protein: 3,
      carbs: 12,
      fat: 21
    }
  },
  {
    id: '9',
    name: 'Black Beans (Organic)',
    price: 2.49,
    url: 'https://target.com/black-beans',
    image: '/api/placeholder/400/300',
    pricePerUnit: '$0.16/oz',
    shopName: 'Target',
    isAvailable: true,
    category: 'legume',
    nutritionInfo: {
      calories: 227,
      protein: 15,
      carbs: 41,
      fat: 0.9
    }
  },
  {
    id: '10',
    name: 'Baby Spinach',
    price: 3.99,
    url: 'https://whole-foods.com/spinach',
    image: '/api/placeholder/400/300',
    pricePerUnit: '$4.99/lb',
    shopName: 'Whole Foods Market',
    isAvailable: true,
    category: 'vegetable',
    nutritionInfo: {
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4
    }
  }
]

// Hook simulation - would be replaced with actual React Query hook
export const useFoodItems = () => {
  return {
    data: mockFoodItems,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve()
  }
}