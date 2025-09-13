'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, DollarSign, Star, ShoppingCart, ChefHat, ArrowRight, Trophy, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingList, StoreShoppingList, ShoppingComparison } from '@/types/shopping';
import { ShoppingService } from '@/services/shopping';
import dynamic from 'next/dynamic';

const StoreMap = dynamic(() => import('./StoreMap').then(mod => ({ default: mod.StoreMap })), {
  ssr: false,
  loading: () => <div className="h-64 bg-neutral-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

interface ShoppingModalProps {
  shoppingList: ShoppingList;
  isOpen: boolean;
  onClose: () => void;
  onStartCooking: () => void;
}

export function ShoppingModal({ 
  shoppingList, 
  isOpen, 
  onClose,
  onStartCooking 
}: ShoppingModalProps) {
  const [selectedStore, setSelectedStore] = useState<StoreShoppingList | null>(null);
  const [hoveredStore, setHoveredStore] = useState<StoreShoppingList | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const shoppingService = ShoppingService.getInstance();
  const comparison = shoppingService.generateComparison(shoppingList);

  const handleStoreSelect = (store: StoreShoppingList) => {
    setSelectedStore(store);
  };

  const handleConfirmStore = () => {
    if (selectedStore) {
      // In a real app, this would save the selected store and redirect to shopping
      console.log('Selected store:', selectedStore);
      onStartCooking();
    }
  };

  const getComparisonIcon = (type: keyof ShoppingComparison) => {
    switch (type) {
      case 'cheapest_store': return <DollarSign className="h-4 w-4" />;
      case 'closest_store': return <MapPin className="h-4 w-4" />;
      case 'highest_quality': return <Star className="h-4 w-4" />;
      case 'fastest_shopping': return <Zap className="h-4 w-4" />;
    }
  };

  const getComparisonLabel = (type: keyof ShoppingComparison) => {
    switch (type) {
      case 'cheapest_store': return 'Best Price';
      case 'closest_store': return 'Closest';
      case 'highest_quality': return 'Best Quality';
      case 'fastest_shopping': return 'Fastest';
    }
  };

  const getComparisonColor = (type: keyof ShoppingComparison) => {
    switch (type) {
      case 'cheapest_store': return 'bg-green-500';
      case 'closest_store': return 'bg-blue-500';
      case 'highest_quality': return 'bg-yellow-500';
      case 'fastest_shopping': return 'bg-purple-500';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
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
              <h2 className="text-2xl font-bold mb-2">Find Your Ingredients</h2>
              <p className="text-white/90 mb-4">
                Choose the best store for your {shoppingList.recipe_name} ingredients
              </p>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span>{shoppingList.missing_ingredients.length} missing ingredients</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{shoppingList.stores.length} nearby stores</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-[600px]">
            {/* Left Panel - Store Recommendations */}
            <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
              <h3 className="font-bold text-lg mb-4">Quick Picks</h3>
              
              {/* Comparison Cards */}
              <div className="space-y-3 mb-6">
                {(Object.keys(comparison) as Array<keyof ShoppingComparison>).map((key) => {
                  const store = comparison[key];
                  const isSelected = selectedStore?.store.id === store.store.id;
                  
                  return (
                    <motion.button
                      key={key}
                      onClick={() => setSelectedStore(store)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-primary-300 bg-primary-50' 
                          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full ${getComparisonColor(key)} flex items-center justify-center text-white`}>
                          {getComparisonIcon(key)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{getComparisonLabel(key)}</h4>
                          <p className="text-xs text-gray-600">{store.store.name}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>${store.total_price.toFixed(2)}</span>
                        <span>{store.store.distance.toFixed(1)} km</span>
                        <span>{store.estimated_shopping_time} min</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* All Stores List */}
              <h4 className="font-semibold mb-3">All Stores</h4>
              <div className="space-y-2">
                {shoppingList.stores.map((store) => {
                  const isSelected = selectedStore?.store.id === store.store.id;
                  const isRecommended = Object.values(comparison).some(
                    comp => comp.store.id === store.store.id
                  );
                  
                  return (
                    <motion.button
                      key={store.store.id}
                      onClick={() => setSelectedStore(store)}
                      whileHover={{ scale: 1.01 }}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        isSelected 
                          ? 'border-primary-300 bg-primary-50' 
                          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{store.store.name}</h5>
                        {isRecommended && (
                          <Trophy className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>${store.total_price.toFixed(2)}</span>
                        <span>{store.store.distance.toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span className="text-xs">{store.store.rating.toFixed(1)}</span>
                        <Badge size="sm" className="ml-2 text-xs">
                          {store.store.price_level}
                        </Badge>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Map and Details */}
            <div className="flex-1 p-6">
              {/* View Toggle */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Store Locations</h3>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1 text-sm transition-colors ${
                      viewMode === 'map' 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Map
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 text-sm transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {/* Map View */}
              {viewMode === 'map' && (
                <StoreMap
                  shoppingList={shoppingList}
                  onStoreSelect={handleStoreSelect}
                  selectedStore={selectedStore}
                  onStoreHover={setHoveredStore}
                  onStartCooking={onStartCooking}
                />
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="h-[400px] overflow-y-auto border rounded-lg">
                  {shoppingList.stores.map((store) => (
                    <div
                      key={store.store.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedStore?.store.id === store.store.id ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => setSelectedStore(store)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{store.store.name}</h4>
                        <Badge>{store.store.price_level}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{store.store.address}</p>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span>{store.store.distance.toFixed(1)} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          <span>${store.total_price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span>{store.estimated_shopping_time} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{store.store.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Store Details */}
              {selectedStore && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-gray-50 rounded-lg"
                >
                  <h4 className="font-semibold mb-3">Selected Store: {selectedStore.store.name}</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="font-bold text-lg text-green-600">${selectedStore.total_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Shopping Time</p>
                      <p className="font-bold text-lg text-blue-600">{selectedStore.estimated_shopping_time} min</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmStore}
                      className="flex-1 text-white"
                      style={{ 
                        background: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)'
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Go Shopping
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}