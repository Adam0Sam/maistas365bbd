// API Response types matching parse-recipe-ai.ts
export interface APIIngredient {
  name: string;
  quantity: string;
  search_description: string;
}

export interface APIProduct {
  productId: string;
  name: string;
  price: number;
  shop: string;
}

export interface APIShoppingListItem {
  ingredient: string;
  chosen_product: APIProduct;
}

export interface APIShoppingLists {
  iki: APIShoppingListItem[];
  rimi: APIShoppingListItem[];
  maxima: APIShoppingListItem[];
}

export interface APIRecipeResponse {
  ingredients: APIIngredient[];
  candidates: any; // Not needed for UI
  shopping_lists: APIShoppingLists;
}

// UI types for the shopping interface
export interface ShoppingIngredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  price: number;
  currency: string;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  quality_score: number; // 1-5 rating
  organic?: boolean;
  brand?: string;
  productId: string;
}

export interface Store {
  id: string;
  name: string;
  chain: 'iki' | 'rimi' | 'maxima';
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance: number; // in km
  rating: number; // 1-5 rating
  price_level: 'budget' | 'moderate' | 'premium';
  opening_hours: {
    [key: string]: string; // day: "09:00-21:00"
  };
  phone?: string;
  website?: string;
  features: string[]; // ['parking', 'delivery', 'organic_section']
}

export interface StoreShoppingList {
  store: Store;
  ingredients: ShoppingIngredient[];
  total_price: number;
  total_items: number;
  estimated_shopping_time: number; // in minutes
}

export interface ShoppingList {
  id: string;
  recipe_id: string;
  recipe_name: string;
  user_location: {
    lat: number;
    lng: number;
  };
  missing_ingredients: string[]; // ingredient names that user doesn't have
  stores: StoreShoppingList[];
  generated_at: string;
  expires_at: string;
}

export interface ShoppingComparison {
  cheapest_store: StoreShoppingList;
  closest_store: StoreShoppingList;
  highest_quality: StoreShoppingList;
  fastest_shopping: StoreShoppingList;
}

export interface MapStore {
  id: string;
  store: Store;
  position: {
    lat: number;
    lng: number;
  };
  ingredients_count: number;
  total_price: number;
  highlighted?: boolean;
}