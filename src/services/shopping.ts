import { 
  ShoppingList, 
  StoreShoppingList, 
  Store, 
  ShoppingIngredient, 
  ShoppingComparison,
  APIRecipeResponse,
  APIShoppingLists
} from '@/types/shopping';
import { ShoppingCache } from '@/lib/shopping-cache';

export class ShoppingService {
  private static instance: ShoppingService;
  private cache: ShoppingCache;

  constructor() {
    this.cache = ShoppingCache.getInstance();
  }

  static getInstance(): ShoppingService {
    if (!ShoppingService.instance) {
      ShoppingService.instance = new ShoppingService();
    }
    return ShoppingService.instance;
  }

  async generateShoppingList(
    recipeId: string,
    recipeName: string,
    missingIngredients: string[],
    userLocation: { lat: number; lng: number },
    recipe: any // Full recipe object with instructions
  ): Promise<ShoppingList> {
    try {
      // Check cache first
      console.log('🔍 [ShoppingService] Checking cache for shopping list...');
      const cachedResult = this.cache.getCachedShoppingList(recipeId, missingIngredients, userLocation);
      
      if (cachedResult) {
        console.log('⚡ [ShoppingService] Using cached shopping list data');
        return cachedResult;
      }

      console.log('🛒 [ShoppingService] No cache found, calling real API for shopping list generation...');
      
      // Call the real API endpoint
      const apiResponse = await fetch('/api/chat/parse-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe: `${recipeName}\n\nInstructions:\n${recipe?.steps?.map((s: any) => s.instruction).join('\n') || 'Cook the recipe ingredients.'}`,
          requirements: `Find products for missing ingredients: ${missingIngredients.join(', ')}. Prioritize organic and high-quality options when available.`,
          ingredients: missingIngredients.map(name => ({
            name,
            quantity: this.estimateQuantity(name)
          })),
          fields: ['name', 'price', 'shop', 'productId'],
          limit: 5
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`API call failed: ${apiResponse.status}`);
      }

      const apiData: APIRecipeResponse = await apiResponse.json();
      console.log('✅ [ShoppingService] API response received:', apiData);

      // Transform API response to UI format
      const storeShoppingLists = this.transformAPIResponseToStores(
        apiData.shopping_lists,
        userLocation
      );

      const shoppingList: ShoppingList = {
        id: `shopping_${Date.now()}`,
        recipe_id: recipeId,
        recipe_name: recipeName,
        user_location: userLocation,
        missing_ingredients: missingIngredients,
        stores: storeShoppingLists,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      // Cache the result
      console.log('💾 [ShoppingService] Caching shopping list data...');
      this.cache.cacheShoppingList(recipeId, missingIngredients, userLocation, shoppingList);

      return shoppingList;
    } catch (error) {
      console.error('❌ [ShoppingService] Error generating shopping list:', error);
      
      // Check if we have any cached data for this meal (even if slightly different ingredients/location)
      console.log('🔄 [ShoppingService] Checking for any cached data as fallback...');
      const fallbackCached = this.cache.getCachedShoppingList(recipeId, missingIngredients, userLocation);
      
      if (fallbackCached) {
        console.log('⚡ [ShoppingService] Using cached data as fallback');
        return fallbackCached;
      }

      // Final fallback to mock data
      console.log('🔄 [ShoppingService] Falling back to mock data...');
      const mockResult = await this.generateMockShoppingList(recipeId, recipeName, missingIngredients, userLocation);
      
      // Cache the mock result too (with shorter expiration)
      console.log('💾 [ShoppingService] Caching mock data with shorter expiration...');
      const shortCacheDuration = 1000 * 60 * 15; // 15 minutes for mock data
      this.cache.cacheShoppingList(recipeId, missingIngredients, userLocation, mockResult, shortCacheDuration);
      
      return mockResult;
    }
  }

  private transformAPIResponseToStores(
    apiShoppingLists: APIShoppingLists,
    userLocation: { lat: number; lng: number }
  ): StoreShoppingList[] {
    const stores: StoreShoppingList[] = [];
    
    // Process each store chain
    const storeChains = [
      { key: 'iki', name: 'IKI', chain: 'iki' as const },
      { key: 'rimi', name: 'Rimi', chain: 'rimi' as const },
      { key: 'maxima', name: 'Maxima', chain: 'maxima' as const }
    ];

    storeChains.forEach(({ key, name, chain }) => {
      const storeItems = apiShoppingLists[key as keyof APIShoppingLists] || [];
      
      if (storeItems.length > 0) {
        // Create store info
        const store = this.createStoreInfo(name, chain, userLocation);
        
        // Transform ingredients
        const ingredients = storeItems.map(item => this.transformAPIIngredient(item));
        
        // Calculate totals
        const totalPrice = ingredients.reduce((sum, ing) => sum + ing.price, 0);
        const estimatedTime = this.calculateShoppingTime(ingredients.length, store);

        stores.push({
          store,
          ingredients,
          total_price: totalPrice,
          total_items: ingredients.length,
          estimated_shopping_time: estimatedTime
        });
      }
    });

    // Sort by total price (cheapest first)
    stores.sort((a, b) => a.total_price - b.total_price);
    
    return stores;
  }

  private transformAPIIngredient(apiItem: any): ShoppingIngredient {
    return {
      id: apiItem.chosen_product.productId,
      name: apiItem.chosen_product.name,
      quantity: this.estimateQuantity(apiItem.ingredient),
      unit: this.getUnitForIngredient(apiItem.ingredient),
      price: apiItem.chosen_product.price,
      currency: 'EUR',
      availability: 'in_stock' as const,
      quality_score: 4.0 + Math.random(),
      organic: Math.random() > 0.7,
      brand: this.extractBrand(apiItem.chosen_product.name),
      productId: apiItem.chosen_product.productId
    };
  }

  private createStoreInfo(name: string, chain: 'iki' | 'rimi' | 'maxima', userLocation: { lat: number; lng: number }): Store {
    // Generate realistic coordinates near user location (within ~2km)
    const offsetLat = (Math.random() - 0.5) * 0.02;
    const offsetLng = (Math.random() - 0.5) * 0.02;
    const lat = userLocation.lat + offsetLat;
    const lng = userLocation.lng + offsetLng;
    const distance = Math.sqrt(offsetLat * offsetLat + offsetLng * offsetLng) * 111;

    return {
      id: `${chain}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      chain,
      address: this.generateStoreAddress(name),
      coordinates: { lat, lng },
      distance: Math.round(distance * 10) / 10,
      rating: this.getStoreRating(chain),
      price_level: this.getStorePriceLevel(chain),
      opening_hours: this.getStoreHours(),
      phone: this.generatePhoneNumber(),
      website: `https://${chain}.lt`,
      features: this.getStoreFeatures(chain)
    };
  }

  private getStoreRating(chain: 'iki' | 'rimi' | 'maxima'): number {
    const ratings = { iki: 3.8, rimi: 4.5, maxima: 4.0 };
    return ratings[chain] + (Math.random() - 0.5) * 0.4;
  }

  private getStorePriceLevel(chain: 'iki' | 'rimi' | 'maxima'): 'budget' | 'moderate' | 'premium' {
    const levels = { iki: 'budget' as const, rimi: 'premium' as const, maxima: 'moderate' as const };
    return levels[chain];
  }

  private getStoreHours() {
    return {
      'Monday': '08:00-22:00',
      'Tuesday': '08:00-22:00',
      'Wednesday': '08:00-22:00',
      'Thursday': '08:00-22:00',
      'Friday': '08:00-23:00',
      'Saturday': '08:00-23:00',
      'Sunday': '09:00-21:00'
    };
  }

  private getStoreFeatures(chain: 'iki' | 'rimi' | 'maxima'): string[] {
    const baseFeatures = ['parking', 'credit_cards'];
    const chainFeatures = {
      iki: ['organic_section', 'deli', 'bakery', 'pharmacy'],
      rimi: ['pharmacy', 'deli', 'bakery'],
      maxima: ['pharmacy', 'deli', 'bakery', 'electronics']
    };
    return [...baseFeatures, ...chainFeatures[chain]];
  }

  private generateStoreAddress(storeName: string): string {
    const streets = ['Gedimino pr.', 'Konstitucijos pr.', 'Kalvarijų g.', 'Savanorių pr.', 'Ukmergės g.'];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 200) + 1;
    return `${street} ${number}, Vilnius, Lithuania`;
  }

  private generatePhoneNumber(): string {
    return `+370 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90000) + 10000}`;
  }

  private estimateQuantity(ingredientName: string): string {
    const lowerName = ingredientName.toLowerCase();
    if (lowerName.includes('oil') || lowerName.includes('vinegar')) return '500ml';
    if (lowerName.includes('salt') || lowerName.includes('pepper') || lowerName.includes('spice')) return '100g';
    if (lowerName.includes('meat') || lowerName.includes('chicken') || lowerName.includes('fish')) return '500g';
    if (lowerName.includes('milk') || lowerName.includes('cream')) return '1L';
    if (lowerName.includes('cheese')) return '200g';
    if (lowerName.includes('eggs')) return '10 pcs';
    if (lowerName.includes('bread')) return '1 pcs';
    return '1 pcs';
  }

  private getUnitForIngredient(ingredientName: string): string {
    const lowerName = ingredientName.toLowerCase();
    if (lowerName.includes('oil') || lowerName.includes('milk') || lowerName.includes('cream')) return 'ml';
    if (lowerName.includes('meat') || lowerName.includes('cheese') || lowerName.includes('flour')) return 'g';
    if (lowerName.includes('eggs') || lowerName.includes('bread') || lowerName.includes('apple')) return 'pcs';
    return 'pcs';
  }

  private extractBrand(productName: string): string {
    const words = productName.split(' ');
    const firstWord = words[0];
    if (firstWord && firstWord.length > 2 && firstWord[0] === firstWord[0].toUpperCase()) {
      return firstWord;
    }
    return 'Generic';
  }

  generateComparison(shoppingList: ShoppingList): ShoppingComparison {
    const stores = shoppingList.stores;
    
    return {
      cheapest_store: stores.reduce((prev, current) => 
        prev.total_price < current.total_price ? prev : current
      ),
      closest_store: stores.reduce((prev, current) => 
        prev.store.distance < current.store.distance ? prev : current
      ),
      highest_quality: stores.reduce((prev, current) => 
        prev.store.rating > current.store.rating ? prev : current
      ),
      fastest_shopping: stores.reduce((prev, current) => 
        prev.estimated_shopping_time < current.estimated_shopping_time ? prev : current
      )
    };
  }

  private calculateShoppingTime(itemCount: number, store: Store): number {
    const baseTime = 10; // minutes
    const timePerItem = 2; // minutes per item
    const storeSize = store.chain === 'maxima' ? 1.5 : 1;
    
    return Math.ceil((baseTime + (itemCount * timePerItem)) * storeSize);
  }

  // Fallback method for when API fails
  private async generateMockShoppingList(
    recipeId: string,
    recipeName: string,
    missingIngredients: string[],
    userLocation: { lat: number; lng: number }
  ): Promise<ShoppingList> {
    const mockStores = this.getMockStores(userLocation);
    const storeShoppingLists: StoreShoppingList[] = [];
    
    for (const store of mockStores) {
      const ingredients = this.getMockIngredientPrices(store.id, missingIngredients);
      const totalPrice = ingredients.reduce((sum, ing) => sum + ing.price, 0);
      const estimatedTime = this.calculateShoppingTime(ingredients.length, store);
      
      storeShoppingLists.push({
        store,
        ingredients,
        total_price: totalPrice,
        total_items: ingredients.length,
        estimated_shopping_time: estimatedTime
      });
    }

    storeShoppingLists.sort((a, b) => a.store.distance - b.store.distance);

    return {
      id: `shopping_${Date.now()}`,
      recipe_id: recipeId,
      recipe_name: recipeName,
      user_location: userLocation,
      missing_ingredients: missingIngredients,
      stores: storeShoppingLists,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  private getMockStores(userLocation: { lat: number; lng: number }): Store[] {
    return [
      this.createStoreInfo('IKI', 'iki', userLocation),
      this.createStoreInfo('Rimi', 'rimi', userLocation),
      this.createStoreInfo('Maxima', 'maxima', userLocation)
    ];
  }

  private getMockIngredientPrices(storeId: string, ingredients: string[]): ShoppingIngredient[] {
    const priceMultipliers: Record<string, number> = {
      iki: 0.8,
      rimi: 1.3,
      maxima: 1.0,
    };

    const chain = storeId.split('_')[0] as 'iki' | 'rimi' | 'maxima';
    const multiplier = priceMultipliers[chain] || 1.0;

    return ingredients.map((ingredientName) => {
      const basePrice = this.getBasePrice(ingredientName);
      const price = Math.round(basePrice * multiplier * 100) / 100;
      
      return {
        id: `${storeId}_${ingredientName.toLowerCase().replace(/\s+/g, '_')}`,
        name: ingredientName,
        quantity: this.estimateQuantity(ingredientName),
        unit: this.getUnitForIngredient(ingredientName),
        price,
        currency: 'EUR',
        availability: Math.random() > 0.1 ? 'in_stock' : 'limited' as const,
        quality_score: Math.round((3 + Math.random() * 2) * 10) / 10,
        organic: Math.random() > 0.7,
        brand: this.getTypicalBrand(ingredientName),
        productId: `mock_${Math.random().toString(36).substr(2, 9)}`
      };
    });
  }

  private getBasePrice(ingredient: string): number {
    const prices: Record<string, number> = {
      'olive oil': 8.99,
      'salt': 1.49,
      'pepper': 3.99,
      'garlic': 2.99,
      'onion': 1.99,
      'tomatoes': 3.49,
      'cheese': 5.99,
      'milk': 3.99,
      'eggs': 2.99,
      'bread': 2.49,
      'rice': 4.99,
      'pasta': 1.99,
      'chicken': 8.99,
      'beef': 12.99,
      'fish': 15.99,
    };
    
    const lowerIngredient = ingredient.toLowerCase();
    for (const [key, price] of Object.entries(prices)) {
      if (lowerIngredient.includes(key)) {
        return price;
      }
    }
    
    return 2.99 + Math.random() * 5;
  }

  private getTypicalBrand(ingredient: string): string {
    const brands: Record<string, string[]> = {
      'olive oil': ['Bertolli', 'Filippo Berio', 'Monini'],
      'cheese': ['Džiugas', 'Rokiškio', 'Vilkyškių'],
      'milk': ['Žemaitijos', 'Rokiškio', 'Marijampolės'],
      'pasta': ['Barilla', 'De Cecco', 'Makfa'],
    };
    
    const lowerIngredient = ingredient.toLowerCase();
    for (const [key, brandList] of Object.entries(brands)) {
      if (lowerIngredient.includes(key)) {
        return brandList[Math.floor(Math.random() * brandList.length)];
      }
    }
    
    return 'Generic';
  }

  // Cache management methods
  clearShoppingCache(): void {
    console.log('🗑️ [ShoppingService] Clearing all shopping cache...');
    this.cache.clearAllCache();
  }

  getCacheStats() {
    return this.cache.getCacheStats();
  }
}