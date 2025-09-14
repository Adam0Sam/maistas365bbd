"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Timer,
  Utensils
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLikedMeals } from "@/contexts/LikedMealsContext";
import { FoodItem } from "@/types/food";
import { ParsedRecipe, StepGraph, GraphTrack, GraphSimpleStep } from "@/lib/parse-full-recipe";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";

export default function CookingStepsPage() {
  const params = useParams();
  const router = useRouter();
  const { getLikedMealById, likedMeals, isLoading: contextLoading } = useLikedMeals();
  
  const [meal, setMeal] = useState<FoodItem | null>(null);
  const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
  const [graph, setGraph] = useState<StepGraph | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [activeTimers, setActiveTimers] = useState<Map<string, number>>(new Map());
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Generate storage keys based on meal ID
  const getStorageKey = React.useCallback((suffix: string) => {
    const encodedMealId = params?.mealId as string;
    return `cooking_${encodedMealId}_${suffix}`;
  }, [params?.mealId]);

  // Load state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !params?.mealId) return;
    
    try {
      // Load current step index
      const savedStepIndex = localStorage.getItem(getStorageKey('currentStep'));
      if (savedStepIndex) {
        setCurrentStepIndex(parseInt(savedStepIndex, 10));
      }

      // Load completed steps
      const savedCompletedSteps = localStorage.getItem(getStorageKey('completedSteps'));
      if (savedCompletedSteps) {
        setCompletedSteps(new Set(JSON.parse(savedCompletedSteps)));
      }

      // Load active timers
      const savedTimers = localStorage.getItem(getStorageKey('activeTimers'));
      if (savedTimers) {
        const timersData = JSON.parse(savedTimers);
        setActiveTimers(new Map(Object.entries(timersData)));
      }
    } catch (error) {
      console.warn('Failed to load cooking state from localStorage:', error);
    }
  }, [params?.mealId, getStorageKey]);

  // Helper functions to save to localStorage
  const saveCurrentStep = (stepIndex: number) => {
    if (typeof window !== 'undefined' && params?.mealId) {
      localStorage.setItem(getStorageKey('currentStep'), stepIndex.toString());
    }
  };

  const saveCompletedSteps = (steps: Set<string>) => {
    if (typeof window !== 'undefined' && params?.mealId) {
      localStorage.setItem(getStorageKey('completedSteps'), JSON.stringify([...steps]));
    }
  };

  const saveActiveTimers = (timers: Map<string, number>) => {
    if (typeof window !== 'undefined' && params?.mealId) {
      const timersObject = Object.fromEntries(timers);
      localStorage.setItem(getStorageKey('activeTimers'), JSON.stringify(timersObject));
    }
  };

  // Load meal and recipe data
  useEffect(() => {
    const loadRecipeData = async () => {
      const encodedMealId = params?.mealId as string;
      const mealId = decodeURIComponent(encodedMealId);
      
      if (!mealId) {
        setError("Invalid meal ID");
        setIsLoading(false);
        return;
      }

      // Wait for context to finish loading
      if (contextLoading) {
        console.log("Steps page - Context still loading, waiting...");
        return;
      }

      console.log("Steps page - Looking for meal ID:", mealId);
      console.log("Steps page - All liked meals:", likedMeals);
      console.log("Steps page - Liked meals IDs:", likedMeals.map(m => m.id));
      
      const foundMeal = getLikedMealById(mealId);
      console.log("Steps page - Found meal:", foundMeal);
      
      if (!foundMeal) {
        // Let's also try to debug what meals are available
        console.log("Steps page - Failed to find meal. Debugging available meals...");
        console.log("Steps page - Searching for exact match:", mealId);
        console.log("Steps page - Available IDs:", likedMeals.map(m => `"${m.id}"`).join(', '));
        setError(`Meal not found in your favorites. Looking for: "${mealId}"`);
        setIsLoading(false);
        return;
      }

      setMeal(foundMeal);

      // Extract recipe and graph data
      if (foundMeal.recipeData) {
        if ('generated' in foundMeal.recipeData && 'plan' in foundMeal.recipeData) {
          const { generated } = foundMeal.recipeData;
          
          // For now, always use basic structure (API calls should be server-side only)
            
            // Fallback to basic structure
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
                core: index < 3
              })),
              steps: generated.instructions.map((instruction, index) => ({
                instruction,
                number: index + 1
              }))
            };

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
                    duration_minutes: instruction.includes("cook") || instruction.includes("bake") || 
                                     instruction.includes("simmer") || instruction.includes("heat") ? 
                      Math.floor(Math.random() * 10) + 5 : undefined
                  }))
                }
              ],
              joins: [],
              warnings: []
            };

            setRecipe(convertedRecipe);
            setGraph(basicGraph);
            setSelectedTrackId("main");
        } else if ('instructions' in foundMeal.recipeData) {
          // Handle old format where recipeData is directly the generated recipe
          const generated = foundMeal.recipeData as any;
          
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
            ingredients: (generated.ingredients || []).map((ing: any, index: number) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: "",
              quantity_value: 1,
              core: index < 3
            })),
            steps: (generated.instructions || []).map((instruction: string, index: number) => ({
              instruction,
              number: index + 1
            }))
          };

          const basicGraph: StepGraph = {
            tracks: [
              {
                track_id: "main",
                title: foundMeal.name,
                emoji: "🍽️",
                steps: (generated.instructions || []).map((instruction: string, index: number) => ({
                  step_id: `step_${index + 1}`,
                  number: index + 1,
                  instruction,
                  duration_minutes: instruction.includes("cook") || instruction.includes("bake") ? 
                    Math.floor(Math.random() * 10) + 5 : undefined
                }))
              }
            ],
            joins: [],
            warnings: []
          };

          setRecipe(convertedRecipe);
          setGraph(basicGraph);
          setSelectedTrackId("main");
        }
      } else if (foundMeal.basicRecipe) {
        // Basic recipe data
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
          ingredients: [],
          steps: foundMeal.basicRecipe.instructions.map((instruction, index) => ({
            instruction,
            number: index + 1
          }))
        };

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
                  Math.floor(Math.random() * 10) + 5 : undefined
              }))
            }
          ],
          joins: [],
          warnings: []
        };

        setRecipe(convertedRecipe);
        setGraph(basicGraph);
        setSelectedTrackId("main");
      } else {
        // No recipe data
        setError("No recipe data found for this meal");
      }

      setIsLoading(false);
    };

    loadRecipeData();
  }, [params?.mealId, getLikedMealById, contextLoading, likedMeals]);

  // Timer management
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const newTimers = new Map(prev);
        newTimers.forEach((time, stepId) => {
          if (time > 0) {
            newTimers.set(stepId, time - 1);
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Sync carousel with currentStepIndex
  useEffect(() => {
    if (!carouselApi) return;
    
    carouselApi.scrollTo(currentStepIndex);
  }, [carouselApi, currentStepIndex]);

  // Listen to carousel changes and update currentStepIndex
  useEffect(() => {
    if (!carouselApi) return;

    const handleSelect = () => {
      const index = carouselApi.selectedScrollSnap();
      if (index !== currentStepIndex) {
        setCurrentStepIndex(index);
      }
    };

    carouselApi.on("select", handleSelect);
    
    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi, currentStepIndex]);

  const getCurrentTrack = (): GraphTrack | null => {
    if (!graph || !selectedTrackId) return null;
    return graph.tracks.find(t => t.track_id === selectedTrackId) || null;
  };

  const getCurrentStep = (): GraphSimpleStep | null => {
    const track = getCurrentTrack();
    if (!track) return null;
    return track.steps[currentStepIndex] || null;
  };



  const handleTrackSelect = (trackId: string) => {
    setSelectedTrackId(trackId);
    setCurrentStepIndex(0);
    saveCurrentStep(0);
  };

  const startTimer = (stepId: string, minutes: number) => {
    const newTimers = new Map(activeTimers).set(stepId, minutes * 60);
    setActiveTimers(newTimers);
    saveActiveTimers(newTimers);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTrackProgress = (track: GraphTrack): number => {
    const completedCount = track.steps.filter(s => completedSteps.has(s.step_id)).length;
    return (completedCount / track.steps.length) * 100;
  };

  if (isLoading || contextLoading) {
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
          <p className="text-lg font-medium text-muted-foreground">Loading cooking steps...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !meal || !recipe || !graph) {
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
            {error || "We couldn't find the cooking steps for this recipe."}
          </p>
          <Button onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  const currentTrack = getCurrentTrack();
  const currentStep = getCurrentStep();

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
              onClick={() => router.back()}
              className="shadow-sm hover:shadow-md transition-all duration-300 border-neutral-300 hover:border-primary-400 hover:text-primary-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-center">
              <h1 
                className="text-2xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)' }}
              >
                {recipe.info.title}
              </h1>
              <div className="flex items-center justify-center gap-4 mt-2 text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary-500" />
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

            <Button
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
              className="shadow-sm hover:shadow-md transition-all duration-300 border-neutral-300 hover:border-accent-400 hover:text-accent-600"
            >
              {isPaused ? (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Step Carousel Section */}
        {currentTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            {/* Carousel Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(90deg, #4c9f70 0%, #3d8059 100%)' }}
                >
                  <span className="text-white text-lg">{currentTrack.emoji || '🍳'}</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-800">{currentTrack.title}</h2>
                  <p className="text-sm text-neutral-600">
                    Step {currentStepIndex + 1} of {currentTrack.steps.length}
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="flex-1 max-w-xs mx-8">
                <div className="bg-neutral-200 rounded-full h-2">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ 
                      background: 'linear-gradient(90deg, #4c9f70 0%, #5db382 100%)',
                      width: `${((currentStepIndex + 1) / currentTrack.steps.length) * 100}%`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStepIndex + 1) / currentTrack.steps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Step Counter */}
              <div className="text-sm text-neutral-600 font-medium">
                {currentStepIndex + 1} / {currentTrack.steps.length}
              </div>
            </div>

            {/* Carousel */}
            <Carousel
              setApi={setCarouselApi}
              className="relative max-w-5xl mx-auto"
              completedSteps={currentTrack.steps.map(step => completedSteps.has(step.step_id))}
              currentStep={currentStepIndex}
              opts={{
                align: "center",
                loop: false,
              }}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {currentTrack.steps.map((step, index) => (
                  <CarouselItem key={step.step_id} stepIndex={index} className="pl-2 md:pl-4">
                    <motion.div
                      className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 h-[300px] flex flex-col"
                      style={{
                        background: completedSteps.has(step.step_id) 
                          ? 'linear-gradient(90deg, rgba(76, 159, 112, 0.1) 0%, rgba(84, 105, 164, 0.1) 100%)'
                          : 'rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                            style={{ 
                              background: completedSteps.has(step.step_id)
                                ? 'linear-gradient(90deg, #4c9f70 0%, #3d8059 100%)'
                                : 'linear-gradient(90deg, #6279b8 0%, #5469a4 100%)'
                            }}
                          >
                            {completedSteps.has(step.step_id) ? (
                              <CheckCircle2 className="h-7 w-7" />
                            ) : (
                              step.number
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-neutral-800">
                              Step {step.number}
                            </h3>
                            {step.duration_minutes && (
                              <div className="flex items-center gap-2 mt-1">
                                <Timer className="h-4 w-4 text-accent-500" />
                                <span className="text-sm text-neutral-600">
                                  {step.duration_minutes} minutes
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Timer Section */}
                        {step.duration_minutes && (
                          <div className="flex items-center gap-3">
                            {activeTimers.has(step.step_id) ? (
                              <div className="flex items-center gap-2">
                                <div 
                                  className="text-2xl font-bold"
                                  style={{ 
                                    color: activeTimers.get(step.step_id)! <= 60 ? '#ef4444' : '#3d8059'
                                  }}
                                >
                                  {formatTime(activeTimers.get(step.step_id)!)}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newTimers = new Map(activeTimers);
                                    newTimers.delete(step.step_id);
                                    setActiveTimers(newTimers);
                                    saveActiveTimers(newTimers);
                                  }}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => startTimer(step.step_id, step.duration_minutes!)}
                                className="text-white"
                                style={{ background: 'linear-gradient(90deg, #6279b8 0%, #5469a4 100%)' }}
                              >
                                <Timer className="h-4 w-4 mr-2" />
                                Start Timer
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Step Instruction */}
                      <div className="text-lg leading-relaxed text-neutral-700 mb-8 flex-1">
                        {step.instruction}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          {completedSteps.has(step.step_id) && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>

                        {!completedSteps.has(step.step_id) && (
                          <Button
                            onClick={() => {
                              const newCompletedSteps = new Set(completedSteps).add(step.step_id);
                              setCompletedSteps(newCompletedSteps);
                              saveCompletedSteps(newCompletedSteps);
                              
                              // Auto advance to next step if not the last one
                              if (index < currentTrack.steps.length - 1) {
                                setTimeout(() => {
                                  const newStepIndex = index + 1;
                                  setCurrentStepIndex(newStepIndex);
                                  saveCurrentStep(newStepIndex);
                                }, 500);
                              }
                            }}
                            size="lg"
                            className="text-white font-semibold"
                            style={{ background: 'linear-gradient(90deg, #4c9f70 0%, #3d8059 100%)' }}
                          >
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Mark as Complete
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <CarouselPrevious 
                className="left-4 bg-white/80 backdrop-blur-sm border-neutral-300 hover:bg-white hover:border-primary-400"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' 
                }}
              />
              <CarouselNext 
                className="right-4 bg-white/80 backdrop-blur-sm border-neutral-300 hover:bg-white hover:border-primary-400"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' 
                }}
              />
            </Carousel>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mt-20">
              {currentTrack.steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentStepIndex(index);
                    saveCurrentStep(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStepIndex
                      ? 'w-8 bg-gradient-to-r from-green-500 to-green-300'
                      : completedSteps.has(currentTrack.steps[index].step_id)
                      ? 'bg-green-500'
                      : 'bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* GraphTracks Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">All Cooking Tracks</h3>
          
          {graph.tracks.map((track, trackIndex) => (
            <motion.div
              key={track.track_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: trackIndex * 0.1 }}
              className={`bg-white/80 backdrop-blur-sm rounded-2xl border transition-all duration-300 cursor-pointer ${
                selectedTrackId === track.track_id 
                  ? 'border-primary-400 shadow-lg' 
                  : 'border-neutral-200 hover:border-primary-200 hover:shadow-md'
              }`}
              onClick={() => handleTrackSelect(track.track_id)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ 
                        background: selectedTrackId === track.track_id 
                          ? 'linear-gradient(90deg, #4c9f70 0%, #3d8059 100%)'
                          : 'linear-gradient(90deg, #8ea4d2 0%, #6279b8 100%)'
                      }}
                    >
                      <span className="text-white text-lg">{track.emoji || '🍳'}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-800">{track.title}</h4>
                      <p className="text-sm text-neutral-600">{track.steps.length} steps</p>
                    </div>
                  </div>

                  {/* Track Progress */}
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-neutral-600">
                      {track.steps.filter(s => completedSteps.has(s.step_id)).length} / {track.steps.length} completed
                    </div>
                    <div className="w-32 bg-neutral-200 rounded-full h-2">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ 
                          background: 'linear-gradient(90deg, #4c9f70 0%, #5db382 100%)',
                          width: `${getTrackProgress(track)}%`
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${getTrackProgress(track)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Step Pills */}
                <div className="flex flex-wrap gap-2">
                  {track.steps.map((step) => (
                    <motion.div
                      key={step.step_id}
                      whileHover={{ scale: 1.05 }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        completedSteps.has(step.step_id)
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : selectedTrackId === track.track_id && currentStep?.step_id === step.step_id
                          ? 'bg-primary-100 text-primary-700 border border-primary-300'
                          : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {completedSteps.has(step.step_id) && (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        <span>Step {step.number}</span>
                        {step.duration_minutes && (
                          <span className="text-xs opacity-70">({step.duration_minutes}m)</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Join Points */}
          {graph.joins && graph.joins.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Combination Steps</h3>
              <div className="space-y-3">
                {graph.joins.map((join, idx) => (
                  <motion.div
                    key={join.step_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-xl p-4 border border-accent-200"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(90deg, #6279b8 0%, #5469a4 100%)' }}
                      >
                        <Utensils className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-neutral-800">{join.title}</h4>
                    </div>
                    <p className="text-sm text-neutral-700 mb-2">{join.instruction}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <span>Combines:</span>
                      {join.depends_on.map((trackId) => {
                        const track = graph.tracks.find(t => t.track_id === trackId);
                        return (
                          <Badge key={trackId} variant="outline" className="text-xs">
                            {track?.emoji} {track?.title}
                          </Badge>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Completion Section */}
        {graph.tracks.every(track => 
          track.steps.every(step => completedSteps.has(step.step_id))
        ) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 text-center"
          >
            <div 
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20"
              style={{ background: 'linear-gradient(90deg, rgba(76, 159, 112, 0.1) 0%, rgba(84, 105, 164, 0.1) 100%)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 
                className="text-3xl font-bold mb-4 bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)' }}
              >
                Congratulations!
              </h2>
              <p className="text-lg text-neutral-700 mb-6">
                You've successfully completed cooking {recipe.info.title}!
              </p>
              <Button
                onClick={() => router.push('/liked')}
                size="lg"
                className="text-white font-semibold"
                style={{ background: 'linear-gradient(90deg, #4c9f70 0%, #3d8059 100%)' }}
              >
                <ChefHat className="h-5 w-5 mr-2" />
                Back to Recipes
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}