'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'
import RecipeSwiper from '@/components/RecipeSwiper'
import LikedMeals from '@/components/LikedMeals'

import { 
  saveRecipesToStorage, 
  getRecipesFromStorage,
  shouldShowLandingPage,
  markUserAsReturning,
  incrementRecipesGenerated
} from '@/lib/localStorage'
import { GeneratedRecipe } from '@/lib/generateAndParse'

function HomeContent() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showSwiper, setShowSwiper] = useState(false)
  const [showLikedMeals, setShowLikedMeals] = useState(false)
  const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // Check user state on component mount
  useEffect(() => {
    const initializeApp = () => {
      const shouldShowLanding = shouldShowLandingPage()
      
      if (!shouldShowLanding) {
        // Returning user - show liked meals by default
        setShowLikedMeals(true)
      }
      
      // Load any stored recipes
      const storedRecipes = getRecipesFromStorage()
      if (storedRecipes.length > 0) {
        setGeneratedRecipes(storedRecipes)
      }
      
      setIsInitialLoad(false)
    }

    initializeApp()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsSearching(true)
    setError(null)
    
    try {
      const controller = new AbortController()
      
      const response = await fetch('/api/chat/generateBatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirements: query,
          prompt: 'Create diverse, practical recipes that can be prepared at home',
          limit: 6
        }),
        signal: controller.signal
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.log("error", errorText)
        throw new Error(`Recipe generation failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
      }
      
      const recipes: GeneratedRecipe[] = await response.json()
      
      saveRecipesToStorage(recipes)
      
      incrementRecipesGenerated(recipes.length)
      markUserAsReturning()
      
      setGeneratedRecipes(recipes)
      setShowSwiper(true)
      setShowLikedMeals(false) // Hide liked meals when showing new recipes
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again with simpler requirements.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      console.error('Recipe generation failed:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleShowLikedMeals = () => {
    setShowSwiper(false)
    setShowLikedMeals(true)
  }

  const handleBackToSearch = () => {
    setShowSwiper(false)
    setShowLikedMeals(false)
    setQuery('')
    setError(null)
    // Don't clear generatedRecipes - keep them in state and localStorage
  }
  
  const handleStartOver = () => {
    setShowLikedMeals(false)
    setQuery('')
    setError(null)
    // Don't clear generatedRecipes - keep them available
  }

  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importUrl.trim()) return
    
    setIsImporting(true)
    setImportError(null)
    
    try {
      const response = await fetch('/api/recipe/create-from-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: importUrl }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import recipe')
      }
      
      const { recipe } = await response.json()
      
      // Add the imported recipe to the list
      const newRecipes = [recipe]
      saveRecipesToStorage(newRecipes)
      setGeneratedRecipes(newRecipes)
      
      // Close modal and show the recipe
      setShowImportModal(false)
      setImportUrl('')
      setShowSwiper(true)
      setShowLikedMeals(false)
      
    } catch (err: any) {
      setImportError(err.message)
    } finally {
      setIsImporting(false)
    }
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  }

  const staggerChildren = {
    animate: { transition: { staggerChildren: 0.2 } }
  }

  // Show loading spinner during initial load
  if (isInitialLoad) {
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
          <p className="text-lg font-medium text-muted-foreground">Loading Food360...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
      
      {/* Mesh Pattern Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-slate-200/50 opacity-30"></div>
      
      {/* Large Floating Orbs - More Prominent */}
      <div className="absolute top-10 left-5 w-[500px] h-[500px] bg-gradient-to-br from-blue-400 to-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      <div className="absolute bottom-10 right-5 w-[450px] h-[450px] bg-gradient-to-br from-purple-400 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float" style={{ animationDelay: '6s' }}></div>
      
      {/* Medium Floating Bubbles */}
      <div className="absolute top-20 right-32 w-32 h-32 bg-primary/20 rounded-full animate-float filter blur-xl" style={{ animationDelay: '1s', animationDuration: '8s' }}></div>
      <div className="absolute bottom-32 left-32 w-40 h-40 bg-secondary/20 rounded-full animate-float filter blur-xl" style={{ animationDelay: '3s', animationDuration: '10s' }}></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-accent/25 rounded-full animate-float filter blur-lg" style={{ animationDelay: '5s', animationDuration: '7s' }}></div>
      <div className="absolute top-40 right-10 w-36 h-36 bg-foundation/15 rounded-full animate-float filter blur-xl" style={{ animationDelay: '7s', animationDuration: '9s' }}></div>
      
      {/* Small Floating Particles */}
      <div className="absolute top-60 left-20 w-16 h-16 bg-primary/30 rounded-full animate-float filter blur-md" style={{ animationDelay: '0.5s', animationDuration: '6s' }}></div>
      <div className="absolute bottom-60 right-20 w-20 h-20 bg-secondary/25 rounded-full animate-float filter blur-md" style={{ animationDelay: '2.5s', animationDuration: '8s' }}></div>
      <div className="absolute top-80 left-1/3 w-12 h-12 bg-accent/35 rounded-full animate-float filter blur-sm" style={{ animationDelay: '4.5s', animationDuration: '5s' }}></div>
      <div className="absolute bottom-80 right-1/3 w-28 h-28 bg-foundation/20 rounded-full animate-float filter blur-lg" style={{ animationDelay: '6.5s', animationDuration: '7s' }}></div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(circle_at_1px_1px,rgba(76,159,112,0.3)_1px,transparent_0)] bg-[length:60px_60px]"></div>

      <AnimatePresence mode="wait">

      {/* Navigation */}
      {/* <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-background/60 backdrop-blur-xl border-b border-border/50 shadow-lg"
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"
            >
              Maistas365
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button>
                Sign Up
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav> */}

      {/* Main Landing Page */}
      {!showSwiper && !showLikedMeals && (
        <motion.main
          key="landing"
          initial={{ opacity: 1, y: 0 }}
          animate={showSwiper ? { opacity: 0, y: -100, scale: 0.8 } : { opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="relative z-10 container mx-auto px-4 py-16 lg:py-24 h-lvh flex flex-col justify-center"
        >
          <motion.div
            variants={staggerChildren}
            initial="initial"
            animate="animate"
            className="text-center max-w-4xl mx-auto flex flex-col justify-between w-full"
          >
          {/* Main Heading - Supporting Element */}
          <motion.div variants={fadeInUp} className="mb-14">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              <span 
                className="bg-clip-text text-transparent bg-gradient-to-r from-slate-600 via-indigo-600 to-blue-600"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #8ea4d2 0%, #6279b8 25%, #49516f 50%, #496f5d 75%, #4c9f70 100%)'
                }}
              >
                What do you want to
              </span>
              <br />
              <span 
                className="bg-clip-text text-transparent bg-gradient-to-r from-slate-600 via-indigo-600 to-blue-600"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #8ea4d2 0%, #6279b8 25%, #49516f 50%, #496f5d 75%, #4c9f70 100%)'
                }}
              >
                cook today?
              </span>
            </h1>
          </motion.div>

          {/* Hero Search Form - Dominant Element */}
          <motion.form
            variants={fadeInUp}
            onSubmit={handleSearch}
            className="mb-20"
          >
            <div className="max-w-6xl mx-auto relative ">
              <div className="relative">
                <motion.div 
                  className="relative" 
                  whileFocus={{ scale: 1.02 }} 
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* <Search className="absolute left-8 top-1/2 transform -translate-y-1/2 text-muted-foreground h-8 w-8 z-10" /> */}
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isFocused ? "" : "Chinese lamb with a dash of sechuan sauce"}
                    disabled={isSearching}
                    className="h-24 pl-20 pr-20 text-9xl text-center rounded-full border-4 focus:border-primary/30 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-background/95 backdrop-blur-lg font-medium placeholder:text-muted-foreground/60"
                  />
                  <motion.button
                    type="submit"
                    disabled={!query.trim() || isSearching}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isSearching ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <Search className="h-6 w-6 text-white" />
                    )}
                  </motion.button>
                </motion.div>
              </div>
              
              
              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center"
                >
                  <p className="font-medium">Failed to generate recipes</p>
                  <p className="text-sm mt-1">{error}</p>
                  <p className="text-xs mt-2 text-muted-foreground">Please try a different query or check your connection.</p>
                </motion.div>
              )}
              
              {/* Subtle Glow Effect */}
              {/* <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 rounded-full blur-2xl -z-10 scale-110"></div> */}
            </div>
          </motion.form>

          {/* Import Recipe Button */}
          <motion.div variants={fadeInUp} className="">
            <motion.button
              onClick={() => setShowImportModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-secondary/80 hover:bg-secondary text-secondary-foreground px-8 py-4 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border border-border/50 flex items-center gap-3 mx-auto"
            >
              <Plus className="h-5 w-5" />
              Import Recipe from Website
            </motion.button>
          </motion.div>
          
          </motion.div>
        </motion.main>
      )}

      {/* Recipe Swiper */}
      {showSwiper && generatedRecipes.length > 0 && (
        <RecipeSwiper
          key="recipe-swiper"
          recipes={generatedRecipes}
          onBack={handleBackToSearch}
          onShowLikedMeals={handleShowLikedMeals}
        />
      )}

      {/* Liked Meals */}
      {showLikedMeals && (
        <LikedMeals
          key="liked-meals"
          onBack={handleBackToSearch}
          onStartOver={handleStartOver}
        />
      )}

      {/* Import Recipe Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-2 text-center">Import Recipe</h2>
              <p className="text-muted-foreground text-center mb-6">
                Import your recipe from a website
              </p>
              
              <form onSubmit={handleImportRecipe} className="space-y-4">
                <div>
                  <label htmlFor="import-url" className="block text-sm font-medium mb-2">
                    Recipe URL
                  </label>
                  <Input
                    id="import-url"
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://example.com/recipe"
                    className="w-full"
                    required
                    disabled={isImporting}
                  />
                </div>
                
                {importError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {importError}
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false)
                      setImportUrl('')
                      setImportError(null)
                    }}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    disabled={isImporting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!importUrl.trim() || isImporting}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isImporting ? 'Importing...' : 'Import Recipe'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </AnimatePresence>
    </div>
  )
}

export default function Home() {
  return <HomeContent />
}