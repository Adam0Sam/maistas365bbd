import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FoodItem } from '@/types/food'

interface ParseParallelRequest {
  recipe: string
  requirements: string
  target_servings?: number
}

interface ParseParallelResponse {
  recipe: any
  graph: {
    tracks: Array<{
      track_id: string
      title: string
      emoji?: string
      steps: Array<{
        step_id: string
        number: number
        instruction: string
        duration_minutes?: number
      }>
    }>
    joins: any[]
    warnings: string[]
  }
  annotations: any
}

async function parseParallel(request: ParseParallelRequest): Promise<ParseParallelResponse> {
  const response = await fetch('/api/recipe/parse-parallel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(`Parse parallel failed: ${response.status}`)
  }

  return response.json()
}

function prepareRecipeText(meal: FoodItem, mealDataCache?: any): string {
  // Prepare recipe text for parsing based on meal data
  if (meal.recipeData && 'generated' in meal.recipeData) {
    const { generated } = meal.recipeData
    return `${generated.title || meal.name}

Ingredients:
${generated.ingredients.map((ing: any) => `- ${ing.quantity} ${ing.name}`).join('\n')}

Instructions:
${generated.instructions.map((inst: string, i: number) => `${i + 1}. ${inst}`).join('\n')}`
  } else if (meal.basicRecipe) {
    return `${meal.basicRecipe.title || meal.name}

Servings: ${meal.basicRecipe.servings}

Instructions:
${meal.basicRecipe.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}`
  } else if (mealDataCache) {
    // For regular food items with cached meal data
    return `${meal.name}

Ingredients:
${mealDataCache.ingredients.map((ing: any) => `- ${ing.amount} ${ing.name}`).join('\n')}

Instructions:
${mealDataCache.recipe.instructions.map((inst: string, i: number) => `${i + 1}. ${inst}`).join('\n')}`
  } else {
    // Fallback recipe text
    return `${meal.name}

Instructions:
1. Prepare ${meal.name}
2. Cook according to recipe
3. Serve hot`
  }
}

// Query hook for fetching parsed recipe data
export function useParseParallelQuery(meal: FoodItem | null, mealDataCache?: any) {
  return useQuery({
    queryKey: ['parse-parallel', meal?.id],
    queryFn: async () => {
      if (!meal) throw new Error('No meal provided')
      
      const recipeText = prepareRecipeText(meal, mealDataCache)
      const targetServings = meal.recipeData?.generated?.servings || 
                           meal.recipeData?.servings || 
                           meal.basicRecipe?.servings || 
                           4

      console.log('🔄 [React Query] Parsing recipe into parallel tracks for:', meal.name)
      
      const result = await parseParallel({
        recipe: recipeText,
        requirements: "Parse into parallel cooking tracks for efficient cooking",
        target_servings: targetServings
      })

      console.log('✅ [React Query] Parse-parallel successful:', {
        trackCount: result.graph.tracks.length,
        tracks: result.graph.tracks.map(t => `${t.title} (${t.steps.length} steps)`)
      })

      return result
    },
    enabled: !!meal, // Only run query when meal is provided
    staleTime: 1000 * 60 * 60, // 1 hour - parsed recipes don't change often
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  })
}

// Mutation hook for triggering parse in background
export function useParseParallelMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ meal, mealDataCache }: { meal: FoodItem; mealDataCache?: any }) => {
      const recipeText = prepareRecipeText(meal, mealDataCache)
      const targetServings = meal.recipeData?.generated?.servings || 
                           meal.recipeData?.servings || 
                           meal.basicRecipe?.servings || 
                           4

      console.log('🚀 [React Query Mutation] Triggering background parse-parallel for:', meal.name)
      
      return parseParallel({
        recipe: recipeText,
        requirements: "Parse into parallel cooking tracks for efficient cooking",
        target_servings: targetServings
      })
    },
    onSuccess: (data, variables) => {
      // Cache the result for the query
      queryClient.setQueryData(['parse-parallel', variables.meal.id], data)
      console.log('💾 [React Query] Cached parsed recipe for:', variables.meal.name)
    },
    onError: (error, variables) => {
      console.error('❌ [React Query Mutation] Parse-parallel failed for:', variables.meal.name, error)
    }
  })
}

// Prefetch function for triggering parse in advance
export function usePrefetchParseParallel() {
  const queryClient = useQueryClient()
  
  return (meal: FoodItem, mealDataCache?: any) => {
    const recipeText = prepareRecipeText(meal, mealDataCache)
    const targetServings = meal.recipeData?.generated?.servings || 
                         meal.recipeData?.servings || 
                         meal.basicRecipe?.servings || 
                         4

    console.log('⚡ [React Query Prefetch] Starting prefetch for:', meal.name)
    
    queryClient.prefetchQuery({
      queryKey: ['parse-parallel', meal.id],
      queryFn: () => parseParallel({
        recipe: recipeText,
        requirements: "Parse into parallel cooking tracks for efficient cooking",
        target_servings: targetServings
      }),
      staleTime: 1000 * 60 * 60, // 1 hour
    })
  }
}