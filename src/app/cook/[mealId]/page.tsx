"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChefHat, Check, ShoppingCart, Clock, Users, Star, ChevronRight, X, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingModal } from "@/components/ShoppingModal";
import { useLikedMeals } from "@/contexts/LikedMealsContext";
import { FoodItem } from "@/types/food";
import { ParsedRecipe, StepGraph } from "@/lib/parse-full-recipe";
import { ShoppingList } from "@/types/shopping";
import { ShoppingService } from "@/services/shopping";
import { setupShoppingDebug } from "@/lib/shopping-debug";

export default function CookPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getLikedMealById, likedMeals } = useLikedMeals();
  const [meal, setMeal] = useState<FoodItem | null>(null);
  const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
  const [graph, setGraph] = useState<StepGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set());
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isGeneratingShoppingList, setIsGeneratingShoppingList] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('prompt');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);

  useEffect(() => {
    const encodedMealId = params.mealId as string;
    const mealId = decodeURIComponent(encodedMealId);
    console.log("Encoded meal ID:", encodedMealId);
    console.log("Decoded meal ID:", mealId);
    
    if (!mealId) {
      setError("Invalid meal ID");
      setIsLoading(false);
      return;
    }

    // Get the meal from liked meals
    console.log("All liked meals:", likedMeals);
    console.log("Liked meals count:", likedMeals.length);
    likedMeals.forEach((meal, index) => {
      console.log(`Meal ${index}:`, { id: meal.id, name: meal.name });
    });
    
    const foundMeal = getLikedMealById(mealId);
    console.log("Found meal:", foundMeal);
    
    if (!foundMeal) {
      setError(`Meal not found in your favorites. Looking for ID: ${mealId}`);
      setIsLoading(false);
      return;
    }

    setMeal(foundMeal);

    // Convert FoodItem data to ParsedRecipe format
    if (foundMeal.recipeData) {
      // Check if it's the new format with generated and plan
      if ('generated' in foundMeal.recipeData && 'plan' in foundMeal.recipeData) {
        // New format with full recipe data
        const { generated } = foundMeal.recipeData;
        const convertedRecipe: ParsedRecipe = {
          info: {
            title: generated.title || foundMeal.name,
            description: generated.description,
            servings: generated.servings,
            prep_minutes: generated.prep_time_minutes || 10,
            cook_minutes: generated.cook_time_minutes || 20,
            total_minutes: generated.total_time_minutes || 30,
            difficulty: "medium" as const
          },
          ingredients: generated.ingredients.map((ing, index) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: "",
            quantity_value: 1,
            core: index < 3 // Mark first 3 as core ingredients
          })),
          steps: generated.instructions.map((instruction, index) => ({
            instruction,
            number: index + 1
          }))
        };

        // Create a basic graph structure
        const basicGraph: StepGraph = {
          tracks: [
            {
              track_id: "main",
              title: foundMeal.name,
              emoji: "🍽️",
              steps: generated.instructions.map((instruction, index) => ({
                step_id: `step_${index + 1}`,
                number: index + 1,
                instruction,
                duration_minutes: instruction.includes("cook") || instruction.includes("bake") ? 
                  Math.floor(Math.random() * 10) + 5 : null
              }))
            }
          ],
          joins: [],
          warnings: []
        };

        setRecipe(convertedRecipe);
        setGraph(basicGraph);
      } else {
        // Handle old format where recipeData is directly the generated recipe
        const generated = foundMeal.recipeData as {
          title?: string;
          description?: string;
          servings?: number;
          ingredients?: Array<{name: string; quantity: string}>;
          instructions?: string[];
          total_time_minutes?: number;
          cook_time_minutes?: number;
          prep_time_minutes?: number;
        };

        const convertedRecipe: ParsedRecipe = {
          info: {
            title: generated.title || foundMeal.name,
            description: generated.description || `A delicious ${foundMeal.name} recipe`,
            servings: generated.servings || 4,
            prep_minutes: generated.prep_time_minutes || 10,
            cook_minutes: generated.cook_time_minutes || 20,
            total_minutes: generated.total_time_minutes || 30,
            difficulty: "medium" as const
          },
          ingredients: (generated.ingredients || []).map((ing, index) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: "",
            quantity_value: 1,
            core: index < 3 // Mark first 3 as core ingredients
          })),
          steps: (generated.instructions || []).map((instruction, index) => ({
            instruction,
            number: index + 1
          }))
        };

        // Create a basic graph structure
        const basicGraph: StepGraph = {
          tracks: [
            {
              track_id: "main",
              title: foundMeal.name,
              emoji: "🍽️",
              steps: (generated.instructions || []).map((instruction, index) => ({
                step_id: `step_${index + 1}`,
                number: index + 1,
                instruction,
                duration_minutes: instruction.includes("cook") || instruction.includes("bake") ? 
                  Math.floor(Math.random() * 10) + 5 : null
              }))
            }
          ],
          joins: [],
          warnings: []
        };

        setRecipe(convertedRecipe);
        setGraph(basicGraph);
      }
    } else if (foundMeal.basicRecipe) {
      // Basic recipe data without ingredients - ingredients will be loaded separately
      const convertedRecipe: ParsedRecipe = {
        info: {
          title: foundMeal.basicRecipe.title || foundMeal.name,
          description: foundMeal.basicRecipe.description,
          servings: foundMeal.basicRecipe.servings,
          prep_minutes: 10,
          cook_minutes: 20,
          total_minutes: 30,
          difficulty: "medium" as const
        },
        ingredients: [], // Empty initially - will be loaded when needed
        steps: foundMeal.basicRecipe.instructions.map((instruction, index) => ({
          instruction,
          number: index + 1
        }))
      };

      // Create a basic graph structure from basic recipe
      const basicGraph: StepGraph = {
        tracks: [
          {
            track_id: "main",
            title: foundMeal.name,
            emoji: "🍽️",
            steps: foundMeal.basicRecipe.instructions.map((instruction, index) => ({
              step_id: `step_${index + 1}`,
              number: index + 1,
              instruction,
              duration_minutes: instruction.includes("cook") || instruction.includes("bake") ? 
                Math.floor(Math.random() * 10) + 5 : null
            }))
          }
        ],
        joins: [],
        warnings: []
      };

      setRecipe(convertedRecipe);
      setGraph(basicGraph);
    } else {
      // Fallback for meals without recipe data
      const fallbackRecipe: ParsedRecipe = {
        info: {
          title: foundMeal.name,
          description: `A delicious ${foundMeal.name} recipe`,
          servings: 4,
          prep_minutes: 10,
          cook_minutes: 20,
          total_minutes: 30,
          difficulty: "medium" as const
        },
        ingredients: [
          { name: foundMeal.name, quantity: "1 lb", unit: "", quantity_value: 1, core: true },
          { name: "Olive Oil", quantity: "2 tbsp", unit: "", quantity_value: 2, core: false },
          { name: "Salt", quantity: "1 tsp", unit: "", quantity_value: 1, core: false },
          { name: "Black Pepper", quantity: "1/2 tsp", unit: "", quantity_value: 0.5, core: false }
        ],
        steps: [
          { instruction: "Prepare all ingredients", number: 1 },
          { instruction: "Heat oil in a large pan", number: 2 },
          { instruction: `Cook ${foundMeal.name} until done`, number: 3 },
          { instruction: "Season with salt and pepper", number: 4 },
          { instruction: "Serve hot and enjoy", number: 5 }
        ]
      };
      setRecipe(fallbackRecipe);
    }

    setIsLoading(false);
  }, [params.mealId, getLikedMealById, likedMeals]);

  // Auto-open ingredients modal when requested via query param
  useEffect(() => {
    const shouldCheckIngredients = searchParams?.get('checkIngredients') === 'true';
    if (shouldCheckIngredients && recipe && !isLoading) {
      setShowIngredientsModal(true);
    }
  }, [searchParams, recipe, isLoading]);

  // Check geolocation permission status
  useEffect(() => {
    const checkLocationPermission = async () => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        setLocationPermission('unavailable');
        setUserLocation({ lat: 54.6872, lng: 25.2797 }); // Vilnius, Lithuania
        return;
      }

      // Check if permissions API is available
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setLocationPermission(result.state);
          
          if (result.state === 'granted') {
            requestLocation();
          } else if (result.state === 'denied') {
            // Use fallback location if denied
            setUserLocation({ lat: 54.6872, lng: 25.2797 });
          }
          // If prompt, we'll show the permission modal when shopping is initiated
        } catch (error) {
          console.warn('Permissions API not available, will request on demand');
          setLocationPermission('prompt');
        }
      } else {
        // Permissions API not supported, will request on demand
        setLocationPermission('prompt');
      }
    };

    checkLocationPermission();
  }, []);

  const requestLocation = async () => {
    if (!navigator.geolocation) return;

    setIsGettingLocation(true);
    
    // Use high accuracy options for precise location
    const options = {
      enableHighAccuracy: true, // Use GPS when available
      timeout: 10000, // 10 seconds timeout
      maximumAge: 300000 // Cache for 5 minutes
    };

    try {
      console.log("Getting position")
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
      console.log("position: ", position)

      const { latitude, longitude, accuracy } = position.coords;
      console.log(`📍 Location acquired: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
      
      setUserLocation({
        lat: latitude,
        lng: longitude
      });
      setLocationPermission('granted');
    } catch (error: any) {
      console.error('Error getting precise location:', error);
      
      if (error.code === error.PERMISSION_DENIED) {
        setLocationPermission('denied');
        setUserLocation({ lat: 54.6872, lng: 25.2797 });
      } else {
        // Try again with lower accuracy as fallback
        try {
          const fallbackPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 600000 // 10 minutes cache for fallback
            });
          });

          const { latitude, longitude } = fallbackPosition.coords;
          console.log(`📍 Fallback location acquired: ${latitude}, ${longitude}`);
          
          setUserLocation({
            lat: latitude,
            lng: longitude
          });
          setLocationPermission('granted');
        } catch (fallbackError) {
          console.error('Fallback location also failed:', fallbackError);
          setUserLocation({ lat: 54.6872, lng: 25.2797 });
        }
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const toggleIngredient = (index: number) => {
    setSelectedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleStartCooking = async () => {
    console.log('handleStartCooking called', { recipe: !!recipe, userLocation, selectedIngredients: Array.from(selectedIngredients) });
    
    if (!recipe) {
      console.error('No recipe available');
      return;
    }

    // Note: parse-parallel is already triggered in LikedMeals component when user clicks "Start Cooking This Recipe"
    // The parsed data should already be in localStorage by the time user reaches this point
    console.log('📌 Parse-parallel was already triggered from LikedMeals component');

    const missingCount = getTotalCount() - getSelectedCount();
    console.log('Missing ingredients count:', missingCount);
    
    // If user has all ingredients, start cooking directly
    if (missingCount === 0) {
      console.log('All ingredients available, starting cooking');
      setShowIngredientsModal(false);
      // Navigate to steps page instead of showing modal
      const rawMealId = params?.mealId as string || '';
      router.push(`/cook/${rawMealId}/steps`);
      return;
    }

    // Check if we need to request location permission
    if (locationPermission === 'prompt' && !userLocation) {
      setShowLocationPermissionModal(true);
      return;
    }

    // If user is missing ingredients, generate shopping list
    setIsGeneratingShoppingList(true);
    
    try {
      const missingIngredients = recipe.ingredients
        .filter((_, index) => !selectedIngredients.has(index))
        .map(ingredient => ingredient.name);

      console.log('Missing ingredients:', missingIngredients);

      const shoppingService = ShoppingService.getInstance();
      console.log("userLocation", userLocation)
      const currentLocation = userLocation || { lat: 54.6872, lng: 25.2797 }; // Vilnius fallback
      
      console.log('Generating shopping list...');
      const generatedShoppingList = await shoppingService.generateShoppingList(
        meal?.id || 'unknown',
        recipe.info.title,
        missingIngredients,
        currentLocation,
        recipe
      );

      console.log('Shopping list generated:', generatedShoppingList);
      setShoppingList(generatedShoppingList);
      setShowIngredientsModal(false);
      setShowShoppingModal(true);
    } catch (error) {
      console.error('Error generating shopping list:', error);
      // Fallback to steps page if shopping list generation fails
      setShowIngredientsModal(false);
      const rawMealId = params?.mealId as string || '';
      router.push(`/cook/${rawMealId}/steps`);
    } finally {
      setIsGeneratingShoppingList(false);
    }
  };

  const handleShoppingComplete = () => {
    setShowShoppingModal(false);
    // Navigate to steps page instead of showing modal
    const rawMealId = params.mealId as string;
    console.log("Cook page - Navigating with raw meal ID:", rawMealId);
    console.log("Cook page - Current meal found:", meal?.id);
    // Use the raw meal ID directly since Next.js handles the encoding in the route
    router.push(`/cook/${rawMealId}/steps`);
  };

  const handleLocationPermissionAccept = async () => {
    setShowLocationPermissionModal(false);
    await requestLocation();
    // After getting location, continue with shopping list generation
    setTimeout(() => handleStartCooking(), 100);
  };

  const handleLocationPermissionDecline = () => {
    setShowLocationPermissionModal(false);
    setLocationPermission('denied');
    setUserLocation({ lat: 54.6872, lng: 25.2797 }); // Vilnius fallback
    // Continue with shopping list generation using fallback location
    setTimeout(() => handleStartCooking(), 100);
  };

  const getSelectedCount = () => selectedIngredients.size;
  const getTotalCount = () => recipe?.ingredients?.length || 0;
  const getMissingCount = () => getTotalCount() - getSelectedCount();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-lg font-medium text-muted-foreground">Loading recipe...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !meal || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md p-8"
        >
          <div className="text-6xl mb-6">😵</div>
          <h2 className="text-2xl font-bold mb-4">Recipe Not Found</h2>
          <p className="text-muted-foreground mb-8">
            {error || "We couldn't find this recipe. It may have been removed from your favorites."}
          </p>
          <Button onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with Design System Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(135deg, #8ea4d2 0%, #6279b8 25%, #49516f 50%, #496f5d 75%, #4c9f70 100%)',
        opacity: 0.03
      }}></div>
      
      {/* Floating Orbs */}
      <div 
        className="absolute top-20 left-10 w-64 h-64 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse"
        style={{ background: 'linear-gradient(135deg, #5db382 0%, #3d8059 100%)' }}
      ></div>
      <div 
        className="absolute bottom-20 right-10 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"
        style={{ 
          background: 'linear-gradient(135deg, #a4b8dc 0%, #6279b8 100%)', 
          animationDelay: '2s' 
        }}
      ></div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              className="shadow-sm hover:shadow-md transition-all duration-300 border-neutral-300 hover:border-primary-400 hover:text-primary-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Favorites
            </Button>
            
            <div className="text-center">
              <h1 
                className="text-2xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)' }}
              >
                {recipe.info.title}
              </h1>
              <div className="flex items-center justify-center gap-6 mt-2 text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-primary-500" />
                  <span>{recipe.info.servings} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-accent-500" />
                  <span>{recipe.info.total_minutes} min</span>
                </div>
                <Badge 
                  className="text-white"
                  style={{ background: 'linear-gradient(90deg, #8ea4d2 0%, #6279b8 100%)' }}
                >
                  {recipe.info.difficulty}
                </Badge>
              </div>
            </div>

            <div className="w-32" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative inline-block mb-6"
            >
              <div className="text-8xl drop-shadow-lg">
                {meal.category === 'recipe' ? '👨‍🍳' : '🍽️'}
              </div>
              <div 
                className="absolute -inset-4 rounded-full blur-xl -z-10"
                style={{ background: 'linear-gradient(90deg, rgba(93, 179, 130, 0.3) 0%, rgba(84, 105, 164, 0.3) 100%)' }}
              ></div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              {recipe.info.description || `Let's cook this amazing ${meal.name} together! First, let's check what ingredients you have available.`}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={() => setShowIngredientsModal(true)}
                size="lg"
                className="h-14 px-8 text-lg font-semibold text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
                style={{ 
                  background: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)',
                  backgroundSize: '200% 100%',
                  backgroundPosition: '0% 0%',
                  transition: 'background-position 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundPosition = '100% 0%';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundPosition = '0% 0%';
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                Check Your Ingredients
                <ChevronRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(90deg, #4c9f70 0%, #3d8059 100%)' }}
                >
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-neutral-800">Ingredients</h3>
              </div>
              <p className="text-2xl font-bold text-primary-600">{getTotalCount()}</p>
              <p className="text-sm text-neutral-600">items needed</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(90deg, #6279b8 0%, #5469a4 100%)' }}
                >
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-neutral-800">Cook Time</h3>
              </div>
              <p className="text-2xl font-bold text-accent-600">{recipe.info.total_minutes}</p>
              <p className="text-sm text-neutral-600">minutes total</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(90deg, #8ea4d2 0%, #7490c8 100%)' }}
                >
                  <Star className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-neutral-800">Difficulty</h3>
              </div>
              <p className="text-2xl font-bold text-secondary-600 capitalize">{recipe.info.difficulty}</p>
              <p className="text-sm text-neutral-600">skill level</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Ingredients Selection Modal */}
      <AnimatePresence>
        {showIngredientsModal && (
          <IngredientsModal
            recipe={recipe}
            selectedIngredients={selectedIngredients}
            onToggleIngredient={toggleIngredient}
            onClose={() => {
              setShowIngredientsModal(false);
              // If we auto-opened the modal, navigate back when closing
              if (searchParams.get('checkIngredients') === 'true') {
                router.back();
              }
            }}
            onStartCooking={handleStartCooking}
          />
        )}
      </AnimatePresence>

      {/* Location Permission Modal */}
      <AnimatePresence>
        {showLocationPermissionModal && (
          <LocationPermissionModal
            onAccept={handleLocationPermissionAccept}
            onDecline={handleLocationPermissionDecline}
            isGettingLocation={isGettingLocation}
          />
        )}
      </AnimatePresence>

      {/* Loading Modal for Shopping List Generation */}
      <AnimatePresence>
        {isGeneratingShoppingList && (
          <LoadingModal
            title="Finding Best Stores"
            message="Searching IKI, Rimi, and Maxima for your missing ingredients..."
          />
        )}
      </AnimatePresence>

      {/* Shopping Modal */}
      <AnimatePresence>
        {showShoppingModal && shoppingList && (
          <ShoppingModal
            shoppingList={shoppingList}
            isOpen={true}
            onClose={() => setShowShoppingModal(false)}
            onStartCooking={handleShoppingComplete}
          />
        )}
      </AnimatePresence>

      {/* Cooking Modal - Removed as we now navigate to steps page */}
    </div>
  );
}

// Ingredients Selection Modal Component
interface IngredientsModalProps {
  recipe: ParsedRecipe;
  selectedIngredients: Set<number>;
  onToggleIngredient: (index: number) => void;
  onClose: () => void;
  onStartCooking: () => void;
}

function IngredientsModal({
  recipe,
  selectedIngredients,
  onToggleIngredient,
  onClose,
  onStartCooking,
}: IngredientsModalProps) {
  const selectedCount = selectedIngredients.size;
  const totalCount = recipe.ingredients.length;
  const missingCount = totalCount - selectedCount;
  const completionPercentage = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="relative p-6 text-white"
          style={{ background: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="pr-12">
            <h2 className="text-2xl font-bold mb-2">Check Your Ingredients</h2>
            <p className="text-white/90 mb-4">
              Select the ingredients you have available at home
            </p>
            
            {/* Progress Bar */}
            <div className="bg-white/20 rounded-full h-2 mb-2">
              <motion.div
                className="bg-white h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-white/80">
              {selectedCount} of {totalCount} ingredients selected
            </p>
          </div>
        </div>

        {/* Ingredients List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {recipe.ingredients.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {recipe.ingredients.map((ingredient, index) => {
                const isSelected = selectedIngredients.has(index);
                const isCore = ingredient.core;

                return (
                  <motion.button
                    key={`ingredient-${index}-${ingredient.name}`}
                    onClick={() => onToggleIngredient(index)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 group ${
                      isSelected
                        ? 'border-green-300 shadow-md'
                        : 'bg-neutral-50 border-neutral-200 hover:border-primary-200 hover:bg-primary-25'
                    }`}
                    style={isSelected ? {
                      background: 'linear-gradient(90deg, rgba(76, 159, 112, 0.1) 0%, rgba(84, 105, 164, 0.1) 100%)'
                    } : {}}
                  >
                    {/* Checkbox */}
                    <div 
                      className={`relative flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? 'border-transparent'
                          : 'border-neutral-300 group-hover:border-primary-400'
                      }`}
                      style={isSelected ? {
                        background: 'linear-gradient(90deg, #4c9f70 0%, #6279b8 100%)'
                      } : {}}
                    >
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                          >
                            <Check className="h-3 w-3 text-white" />
                            
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Ingredient Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <h3 className={`font-medium text-sm transition-colors truncate ${
                            isSelected ? 'text-primary-800' : 'text-neutral-800 group-hover:text-primary-700'
                          }`}>
                            {ingredient.name}
                          </h3>
                          {isCore && (
                            <Badge 
                              className="text-white text-xs px-1 py-0 flex-shrink-0"
                              style={{ background: 'linear-gradient(90deg, #6279b8 0%, #5469a4 100%)' }}
                            >
                              ✓
                            </Badge>
                          )}
                        </div>
                        <span className={`text-xs transition-colors truncate ${
                          isSelected ? 'text-primary-600' : 'text-neutral-600'
                        }`}>
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            // Empty ingredients state - will be loaded when cooking starts
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold mb-2 text-neutral-800">
                  Ingredients Loading Later
                </h3>
                <p className="text-neutral-600 mb-4 max-w-md mx-auto">
                  We'll help you find the best ingredients and prices when you start cooking this recipe.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                  <div className="w-2 h-2 rounded-full bg-primary-400"></div>
                  <span>Smart ingredient selection</span>
                  <div className="w-2 h-2 rounded-full bg-primary-400"></div>
                  <span>Best prices</span>
                  <div className="w-2 h-2 rounded-full bg-primary-400"></div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-200">
          <div className="flex gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 border-neutral-300 hover:border-primary-400 hover:text-primary-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log('Button clicked in IngredientsModal');
                onStartCooking();
              }}
              className="flex-1 h-12 text-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              style={{ 
                background: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)',
                transition: 'background 0.3s ease'
              }}
            >
              {recipe.ingredients.length === 0 ? (
                <>
                  <ChefHat className="h-4 w-4 mr-2" />
                  Start Cooking & Load Ingredients
                </>
              ) : missingCount > 0 ? (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Get Missing Ingredients ({missingCount})
                </>
              ) : (
                <>
                  <ChefHat className="h-4 w-4 mr-2" />
                  Start Cooking
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Location Permission Modal Component
interface LocationPermissionModalProps {
  onAccept: () => void;
  onDecline: () => void;
  isGettingLocation: boolean;
}

function LocationPermissionModal({ onAccept, onDecline, isGettingLocation }: LocationPermissionModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div 
          className="relative p-6 text-white text-center"
          style={{ background: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)' }}
        >
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-2xl font-bold mb-2">Find Nearby Stores</h2>
          <p className="text-white/90">
            We'd like to use your location to find the closest IKI, Rimi, and Maxima stores
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Better Prices</h3>
                <p className="text-sm text-gray-600">Find the cheapest ingredients nearby</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Accurate Distances</h3>
                <p className="text-sm text-gray-600">See exact travel time to each store</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Smart Recommendations</h3>
                <p className="text-sm text-gray-600">Get personalized store suggestions</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mb-6">
            <strong>Privacy:</strong> Your location is only used to find nearby stores and is not stored or shared.
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onDecline}
              variant="outline"
              className="flex-1 h-12 border-gray-300 hover:border-gray-400"
              disabled={isGettingLocation}
            >
              Use Default Location
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 h-12 text-white font-semibold"
              style={{ 
                background: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)'
              }}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Allow Location
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Loading Modal Component
interface LoadingModalProps {
  title: string;
  message: string;
}

function LoadingModal({ title, message }: LoadingModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Content */}
        <div className="p-8 text-center">
          {/* <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-t-transparent rounded-full mx-auto mb-6"
            style={{ borderColor: '#3d8059', borderTopColor: 'transparent' }}
          /> */}
          
          <h2 className="text-2xl font-bold mb-4 text-gray-900">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-center space-x-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#3d8059' }}
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#5469a4' }}
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#3d8059' }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}