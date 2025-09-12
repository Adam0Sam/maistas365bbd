'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import FoodSwiper from '@/components/FoodSwiper'
import { useFoodItems } from '@/data/mockFoodItems'
import { SwipeResult } from '@/types/food'

export default function Home() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showSwiper, setShowSwiper] = useState(false)
  
  const { data: foodItems } = useFoodItems()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsSearching(true)
    // Simulate search - replace with actual LLM integration later
    setTimeout(() => {
      setIsSearching(false)
      setShowSwiper(true)
    }, 2000)
  }

  const handleSwiperComplete = (results: SwipeResult[]) => {
    console.log('Swipe results:', results)
    // Handle the results - create recipe, go to cart, etc.
    const likedItems = results.filter(r => r.action === 'like' || r.action === 'superlike')
    console.log('Liked items:', likedItems)
  }

  const handleBackToSearch = () => {
    setShowSwiper(false)
    setQuery('')
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  }

  const staggerChildren = {
    animate: { transition: { staggerChildren: 0.2 } }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatePresence mode="wait">
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
      {!showSwiper && (
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
                  <Search className="absolute left-8 top-1/2 transform -translate-y-1/2 text-muted-foreground h-8 w-8 z-10" />
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isFocused ? "" : "Chinese lamb with a dash of sechuan sauce"}
                    className="h-24 pl-20 pr-52 text-9xl text-center rounded-full border-4 focus:border-primary/30 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-background/95 backdrop-blur-lg font-medium placeholder:text-muted-foreground/60"
                  />
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        type="submit"
                        size="lg"
                        disabled={!query.trim() || isSearching}
                        className="h-12 px-8 text-lg font-semibold rounded-full shadow-lg"
                      >
                        {isSearching ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-current border-t-transparent rounded-full"
                          />
                        ) : (
                          'Find Recipes'
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
              
              
              {/* Subtle Glow Effect */}
              {/* <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 rounded-full blur-2xl -z-10 scale-110"></div> */}
            </div>
          </motion.form>

          {/* Feature Cards - Simplified */}
          
          </motion.div>
        </motion.main>
      )}

      {/* Food Swiper */}
      {showSwiper && foodItems && (
        <FoodSwiper
          foodItems={foodItems}
          onComplete={handleSwiperComplete}
          onBack={handleBackToSearch}
        />
      )}
      </AnimatePresence>
    </div>
  )
}