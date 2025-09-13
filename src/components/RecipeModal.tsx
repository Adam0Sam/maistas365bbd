"use client";

import { useState, useEffect, useRef } from "react";
import {
  ParsedRecipe,
  StepGraph,
  GraphTrack,
  GraphJoin,
} from "@/lib/parse-full-recipe";
import {
  X,
  ChevronDown,
  ChevronRight,
  Check,
  Clock,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Square,
} from "lucide-react";

interface RecipeModalProps {
  recipe: ParsedRecipe;
  graph: StepGraph | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeModal({ recipe, graph, isOpen, onClose }: RecipeModalProps) {
  const [currentPage, setCurrentPage] = useState<"ingredients" | "steps">("ingredients");
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedJoins, setExpandedJoins] = useState<Set<string>>(new Set());
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set());
  const [timers, setTimers] = useState<Map<string, { timeLeft: number; isRunning: boolean; totalTime: number }>>(new Map());
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    return () => {
      // Clean up all timers when component unmounts
      intervalRefs.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  if (!isOpen) return null;

  const handleSaveAndContinue = () => {
    setCurrentPage("steps");
  };

  const handleBack = () => {
    setCurrentPage("ingredients");
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

  const startTimer = (stepId: string, durationMinutes: number) => {
    // Clear existing timer if any
    const existingInterval = intervalRefs.current.get(stepId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const totalSeconds = durationMinutes * 60;
    setTimers(prev => new Map(prev.set(stepId, {
      timeLeft: totalSeconds,
      isRunning: true,
      totalTime: totalSeconds
    })));

    const interval = setInterval(() => {
      setTimers(prev => {
        const newTimers = new Map(prev);
        const timer = newTimers.get(stepId);
        if (timer && timer.timeLeft > 0) {
          newTimers.set(stepId, {
            ...timer,
            timeLeft: timer.timeLeft - 1
          });
        } else if (timer) {
          // Timer finished
          clearInterval(interval);
          intervalRefs.current.delete(stepId);
          newTimers.set(stepId, {
            ...timer,
            timeLeft: 0,
            isRunning: false
          });
        }
        return newTimers;
      });
    }, 1000);

    intervalRefs.current.set(stepId, interval);
  };

  const pauseTimer = (stepId: string) => {
    const interval = intervalRefs.current.get(stepId);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(stepId);
    }
    setTimers(prev => {
      const newTimers = new Map(prev);
      const timer = newTimers.get(stepId);
      if (timer) {
        newTimers.set(stepId, { ...timer, isRunning: false });
      }
      return newTimers;
    });
  };

  const resumeTimer = (stepId: string) => {
    const timer = timers.get(stepId);
    if (timer && timer.timeLeft > 0) {
      const interval = setInterval(() => {
        setTimers(prev => {
          const newTimers = new Map(prev);
          const currentTimer = newTimers.get(stepId);
          if (currentTimer && currentTimer.timeLeft > 0) {
            newTimers.set(stepId, {
              ...currentTimer,
              timeLeft: currentTimer.timeLeft - 1
            });
          } else if (currentTimer) {
            clearInterval(interval);
            intervalRefs.current.delete(stepId);
            newTimers.set(stepId, {
              ...currentTimer,
              timeLeft: 0,
              isRunning: false
            });
          }
          return newTimers;
        });
      }, 1000);

      intervalRefs.current.set(stepId, interval);
      setTimers(prev => {
        const newTimers = new Map(prev);
        const currentTimer = newTimers.get(stepId);
        if (currentTimer) {
          newTimers.set(stepId, { ...currentTimer, isRunning: true });
        }
        return newTimers;
      });
    }
  };

  const stopTimer = (stepId: string) => {
    const interval = intervalRefs.current.get(stepId);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(stepId);
    }
    setTimers(prev => {
      const newTimers = new Map(prev);
      newTimers.delete(stepId);
      return newTimers;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{recipe.info.title}</h2>
              <div className="flex gap-4 mt-1 text-sm text-gray-600">
                <span>🍽️ {recipe.info.servings} servings</span>
                <span>⏱️ {recipe.info.total_minutes} min</span>
                <span>📊 {recipe.info.difficulty}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Container with Slide Animation */}
        <div className="relative h-[calc(100%-140px)] overflow-hidden">
          <div 
            className="flex h-full transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(${currentPage === "ingredients" ? "0" : "-100%"})` }}
          >
            {/* Ingredients Page */}
            <div className="w-full h-full flex-shrink-0 overflow-y-auto px-6 py-4">
              <h3 className="text-xl font-semibold mb-4">Ingredients</h3>
              <div className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <button
                    key={index}
                    onClick={() => toggleIngredient(index)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                      selectedIngredients.has(index)
                        ? "bg-green-50 border-green-300"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedIngredients.has(index)
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedIngredients.has(index) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className={`font-medium ${
                        ingredient.core ? "text-gray-900" : "text-gray-700"
                      }`}>
                        {ingredient.name}
                        {ingredient.core && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Core
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-gray-600">{ingredient.quantity}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Steps Page */}
            <div className="w-full h-full flex-shrink-0 overflow-y-auto px-6 py-4">
              <h3 className="text-xl font-semibold mb-4">Cooking Steps</h3>
              {graph && graph.tracks ? (
                <div className="space-y-4">
                  {/* Track Accordions */}
                  {graph.tracks.map((track) => {
                    const isExpanded = expandedTrack === track.track_id;
                    const allStepsCompleted = track.steps.every(step => 
                      completedSteps.has(step.step_id)
                    );
                    const completedCount = track.steps.filter(step => 
                      completedSteps.has(step.step_id)
                    ).length;
                    
                    return (
                      <div key={track.track_id} className="border rounded-xl overflow-hidden">
                        {/* Track Header */}
                        <button
                          onClick={() => setExpandedTrack(
                            isExpanded ? null : track.track_id
                          )}
                          className={`w-full p-4 flex items-center justify-between transition-all duration-200 ${
                            isExpanded 
                              ? 'bg-blue-50 border-blue-300' 
                              : allStepsCompleted
                              ? 'bg-green-50 hover:bg-green-100'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Completion indicator */}
                            {allStepsCompleted && (
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            
                            <div className="text-3xl">{track.emoji}</div>
                            <div className="text-left">
                              <h4 className="font-semibold text-lg">{track.title}</h4>
                              <div className="text-sm text-gray-600">
                                {completedCount}/{track.steps.length} steps completed
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Progress bar */}
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  allStepsCompleted ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${(completedCount / track.steps.length) * 100}%` }}
                              />
                            </div>
                            
                            {/* Expand/collapse icon */}
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Track Content */}
                        {isExpanded && (
                          <div className="p-6 bg-white border-t">
                            <div className="mb-4">
                              <p className="text-gray-600">Follow these steps in order</p>
                            </div>
                            
                            {/* Horizontal Steps List */}
                            <div className="flex gap-2 items-stretch">
                              {track.steps.map((step, index) => {
                                const isCompleted = completedSteps.has(step.step_id);
                                const isPreviousCompleted = index === 0 || 
                                  completedSteps.has(track.steps[index - 1].step_id);
                                const canComplete = isPreviousCompleted && !isCompleted;
                                const isCurrent = canComplete;
                                
                                return (
                                  <div 
                                    key={step.step_id} 
                                    className={`border rounded-lg transition-all duration-300 ${
                                      isCurrent 
                                        ? 'flex-1 bg-blue-50 border-blue-300' 
                                        : isCompleted
                                        ? 'w-20 bg-green-50 border-green-300'
                                        : 'w-20 bg-gray-50 border-gray-200 opacity-50'
                                    }`}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (canComplete) {
                                          setCompletedSteps(prev => 
                                            new Set([...prev, step.step_id])
                                          );
                                        } else if (isCompleted) {
                                          const subsequentCompleted = track.steps
                                            .slice(index + 1)
                                            .some(s => completedSteps.has(s.step_id));
                                          if (!subsequentCompleted) {
                                            setCompletedSteps(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(step.step_id);
                                              return newSet;
                                            });
                                          }
                                        }
                                      }}
                                      disabled={!canComplete && !isCompleted}
                                      className={`w-full h-full p-3 flex flex-col text-center disabled:cursor-not-allowed ${
                                        isCurrent ? 'items-start text-left' : 'items-center'
                                      }`}
                                    >
                                      <div className={`rounded-full flex items-center justify-center font-semibold mb-2 ${
                                        isCurrent 
                                          ? 'w-10 h-10 text-base bg-blue-500 text-white' 
                                          : 'w-6 h-6 text-xs mx-auto'
                                      } ${
                                        isCompleted 
                                          ? 'bg-green-500 text-white' 
                                          : !isCurrent
                                          ? 'bg-gray-300 text-gray-500'
                                          : ''
                                      }`}>
                                        {isCompleted ? (
                                          <Check className={isCurrent ? "w-5 h-5" : "w-3 h-3"} />
                                        ) : (
                                          step.number
                                        )}
                                      </div>
                                      
                                      <p className={`${
                                        isCurrent ? 'text-sm' : 'text-xs'
                                      } ${
                                        isCompleted ? 'line-through text-gray-500' : 'text-gray-700'
                                      }`}>
                                        {isCurrent ? step.instruction : step.instruction.substring(0, 30) + (step.instruction.length > 30 ? '...' : '')}
                                      </p>
                                      
                                      {step.duration_minutes && (
                                        <div className={`mt-2 ${isCurrent ? 'space-y-2' : ''}`}>
                                          {(() => {
                                            const timer = timers.get(step.step_id);
                                            const hasActiveTimer = timer && timer.timeLeft > 0;
                                            const timerFinished = timer && timer.timeLeft === 0;
                                            
                                            if (isCurrent) {
                                              return (
                                                <div className="space-y-2">
                                                  <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="w-4 h-4" />
                                                    <span className={`font-medium ${
                                                      timerFinished ? 'text-red-600' : 
                                                      hasActiveTimer ? 'text-blue-600' : 'text-gray-600'
                                                    }`}>
                                                      {hasActiveTimer || timerFinished ? 
                                                        formatTime(timer.timeLeft) : 
                                                        `${step.duration_minutes}min`
                                                      }
                                                    </span>
                                                  </div>
                                                  
                                                  <div className="flex gap-1">
                                                    {!timer || (!timer.isRunning && timer.timeLeft === timer.totalTime) ? (
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          startTimer(step.step_id, step.duration_minutes);
                                                        }}
                                                        className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                      >
                                                        <Play className="w-3 h-3" />
                                                      </button>
                                                    ) : timer.isRunning ? (
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          pauseTimer(step.step_id);
                                                        }}
                                                        className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                                      >
                                                        <Pause className="w-3 h-3" />
                                                      </button>
                                                    ) : (
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          resumeTimer(step.step_id);
                                                        }}
                                                        className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                      >
                                                        <Play className="w-3 h-3" />
                                                      </button>
                                                    )}
                                                    
                                                    {timer && (
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          stopTimer(step.step_id);
                                                        }}
                                                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                      >
                                                        <Square className="w-3 h-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                  
                                                  {hasActiveTimer && (
                                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                                      <div 
                                                        className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
                                                        style={{ 
                                                          width: `${((timer.totalTime - timer.timeLeft) / timer.totalTime) * 100}%` 
                                                        }}
                                                      />
                                                    </div>
                                                  )}
                                                  
                                                  {timerFinished && (
                                                    <div className="text-xs text-red-600 font-medium">
                                                      ⏰ Timer finished!
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            } else {
                                              return (
                                                <div className={`text-gray-500 ${
                                                  isCurrent ? 'text-sm' : 'text-xs'
                                                }`}>
                                                  {hasActiveTimer ? formatTime(timer.timeLeft) : 
                                                   timerFinished ? '⏰ Done' :
                                                   `${step.duration_minutes}min`}
                                                </div>
                                              );
                                            }
                                          })()}
                                        </div>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Dependent Steps (Joins) */}
                  {graph.joins && graph.joins.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3 text-orange-700">
                        🔄 Assembly Steps
                      </h3>
                      <div className="space-y-3">
                        {graph.joins.map((join) => {
                          const dependenciesComplete = join.depends_on.every(trackId => {
                            const track = graph.tracks.find(t => t.track_id === trackId);
                            return track?.steps.every(step => completedSteps.has(step.step_id));
                          });
                          const isExpanded = expandedJoins.has(join.step_id);
                          
                          return (
                            <div 
                              key={join.step_id} 
                              className={`border rounded-lg overflow-hidden transition-all ${
                                dependenciesComplete 
                                  ? 'bg-orange-50 border-orange-300' 
                                  : 'bg-gray-50 border-gray-200 opacity-60'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  if (dependenciesComplete) {
                                    setExpandedJoins(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(join.step_id)) {
                                        newSet.delete(join.step_id);
                                      } else {
                                        newSet.add(join.step_id);
                                      }
                                      return newSet;
                                    });
                                  }
                                }}
                                disabled={!dependenciesComplete}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-orange-100 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                                    dependenciesComplete
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-gray-300 text-gray-500'
                                  }`}>
                                    ⚡
                                  </div>
                                  <span className={`font-medium ${
                                    dependenciesComplete ? 'text-gray-800' : 'text-gray-500'
                                  }`}>
                                    {join.title}
                                  </span>
                                </div>
                                {dependenciesComplete && (
                                  isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                  )
                                )}
                              </button>
                              
                              {isExpanded && (
                                <div className="px-4 py-3 bg-white border-t">
                                  <p className="text-gray-700 mb-2">{join.instruction}</p>
                                  <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-600 mb-2">Requires:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {join.depends_on.map(trackId => {
                                        const track = graph.tracks.find(t => t.track_id === trackId);
                                        if (!track) return null;
                                        const isComplete = track.steps.every(step => 
                                          completedSteps.has(step.step_id)
                                        );
                                        return (
                                          <span 
                                            key={trackId}
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              isComplete
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}
                                          >
                                            {track.emoji} {track.title}
                                            {isComplete && ' ✓'}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {recipe.steps.map((step) => (
                    <div key={step.number} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-sm">
                        {step.number}
                      </div>
                      <p className="text-gray-800">{step.instruction}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Navigation */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <div className="flex justify-between">
            {currentPage === "ingredients" ? (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAndContinue}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Save and Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBack}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Ingredients
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}