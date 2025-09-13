import { ShoppingService } from '@/services/shopping';

/**
 * Debug utilities for shopping cache functionality
 * These can be called from browser console for testing
 */

// Make debugging functions available globally in development
declare global {
  interface Window {
    shoppingDebug: {
      getCacheStats: () => void;
      clearCache: () => void;
      testCacheKey: (mealId: string, ingredients: string[], location?: {lat: number, lng: number}) => void;
    };
  }
}

export function setupShoppingDebug() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const shoppingService = ShoppingService.getInstance();
    
    window.shoppingDebug = {
      getCacheStats: () => {
        const stats = shoppingService.getCacheStats();
        console.group('📊 Shopping Cache Statistics');
        console.log('Total entries:', stats.totalEntries);
        console.log('Valid entries:', stats.validEntries);
        console.log('Expired entries:', stats.expiredEntries);
        console.log('Oldest entry:', stats.oldestEntry);
        console.log('Newest entry:', stats.newestEntry);
        console.groupEnd();
        return stats;
      },
      
      clearCache: () => {
        shoppingService.clearShoppingCache();
        console.log('🗑️ Shopping cache cleared!');
      },
      
      testCacheKey: (mealId: string, ingredients: string[], location = {lat: 54.6872, lng: 25.2797}) => {
        console.group('🔑 Cache Key Test');
        console.log('Meal ID:', mealId);
        console.log('Ingredients:', ingredients);
        console.log('Location:', location);
        
        // Test the cache key generation by attempting to get cached data
        try {
          const cache = require('@/lib/shopping-cache').ShoppingCache.getInstance();
          const result = cache.getCachedShoppingList(mealId, ingredients, location);
          console.log('Cache result:', result ? 'FOUND' : 'NOT_FOUND');
          if (result) {
            console.log('Cached data preview:', {
              id: result.id,
              recipe_name: result.recipe_name,
              stores_count: result.stores.length,
              generated_at: result.generated_at
            });
          }
        } catch (error) {
          console.error('Cache test error:', error);
        }
        console.groupEnd();
      }
    };

    console.log('🛠️ Shopping debug tools loaded! Use window.shoppingDebug to access:');
    console.log('  - window.shoppingDebug.getCacheStats()');
    console.log('  - window.shoppingDebug.clearCache()');
    console.log('  - window.shoppingDebug.testCacheKey(mealId, ingredients, location)');
  }
}

/**
 * Log cache performance metrics
 */
export function logCachePerformance(
  operation: 'hit' | 'miss' | 'store',
  mealId: string,
  ingredientsCount: number,
  duration?: number
) {
  if (process.env.NODE_ENV === 'development') {
    const emoji = operation === 'hit' ? '⚡' : operation === 'miss' ? '❌' : '💾';
    const message = `${emoji} Cache ${operation.toUpperCase()}: ${mealId} (${ingredientsCount} ingredients)`;
    
    if (duration) {
      console.log(`${message} - ${duration}ms`);
    } else {
      console.log(message);
    }
  }
}