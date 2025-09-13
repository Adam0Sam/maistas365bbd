'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Store, StoreShoppingList, ShoppingList } from '@/types/shopping';
import { MapPin, Clock, DollarSign, Star, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

interface StoreMapProps {
  shoppingList: ShoppingList;
  onStoreSelect: (store: StoreShoppingList) => void;
  selectedStore: StoreShoppingList | null;
  onStoreHover: (store: StoreShoppingList | null) => void;
  onStartCooking: () => void;
}

// Custom map setup component
function MapSetup() {
  const map = useMap();
  
  useEffect(() => {
    // Remove default markers
    delete (L as any).Icon.Default.prototype._getIconUrl;
    (L as any).Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, [map]);

  return null;
}

// Custom store marker component
interface StoreMarkerProps {
  store: StoreShoppingList;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onStoreSelect: (store: StoreShoppingList) => void;
  onStartCooking: () => void;
}

function StoreMarker({ 
  store, 
  isSelected, 
  isHovered,
  onClick, 
  onMouseEnter, 
  onMouseLeave,
  onStoreSelect,
  onStartCooking
}: StoreMarkerProps) {
  const getPriceLevel = (level: string) => {
    switch (level) {
      case 'budget': return '$';
      case 'moderate': return '$$';
      case 'premium': return '$$$';
      default: return '$$';
    }
  };

  const getStoreColor = (chain: string, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return '#3d8059';
    if (isHovered) return '#5469a4';
    
    const colors: Record<string, string> = {
      'iki': '#e20b26', // IKI red brand color
      'rimi': '#0066cc', // Rimi blue brand color  
      'maxima': '#ff6600', // Maxima orange brand color
      'IKI': '#e20b26',
      'Rimi': '#0066cc',
      'Maxima': '#ff6600'
    };
    
    return colors[chain] || '#6b7280';
  };

  // Create custom marker icon
  const markerIcon = new DivIcon({
    html: `
      <div style="
        width: ${isSelected || isHovered ? '48px' : '40px'};
        height: ${isSelected || isHovered ? '48px' : '40px'};
        border-radius: 50%;
        background: ${getStoreColor(store.store.chain, isSelected, isHovered)};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${isSelected || isHovered ? '14px' : '12px'};
        transition: all 0.2s ease;
        cursor: pointer;
      ">
        ${getPriceLevel(store.store.price_level)}
      </div>
    `,
    className: 'custom-store-marker',
    iconSize: [isSelected || isHovered ? 48 : 40, isSelected || isHovered ? 48 : 40],
    iconAnchor: [isSelected || isHovered ? 24 : 20, isSelected || isHovered ? 24 : 20]
  });

  return (
    <Marker
      position={[store.store.coordinates.lat, store.store.coordinates.lng]}
      icon={markerIcon}
      eventHandlers={{
        click: onClick,
        mouseover: onMouseEnter,
        mouseout: onMouseLeave
      }}
    >
      <Popup closeButton={false} className="store-popup">
        <StorePopupContent store={store} onStartCooking={onStartCooking} />
      </Popup>
    </Marker>
  );
}

// Popup content component
function StorePopupContent({ 
  store, 
  onStartCooking 
}: { 
  store: StoreShoppingList;
  onStartCooking: () => void;
}) {
  return (
    <div className="p-3 min-w-[250px]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{store.store.name}</h3>
          <p className="text-sm text-gray-600">{store.store.address}</p>
        </div>
        <Badge 
          className="ml-2"
          style={{ 
            background: store.store.price_level === 'budget' ? '#10b981' : 
                       store.store.price_level === 'moderate' ? '#3b82f6' : '#8b5cf6',
            color: 'white'
          }}
        >
          {store.store.price_level}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{store.store.distance.toFixed(1)} km</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">{store.store.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="text-sm">${store.total_price.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-sm">{store.estimated_shopping_time} min</span>
        </div>
      </div>

      <div className="mb-3">
        <h4 className="font-semibold text-sm mb-2">Missing Ingredients ({store.total_items})</h4>
        <div className="max-h-24 overflow-y-auto">
          {store.ingredients.slice(0, 3).map((ingredient, index) => (
            <div key={index} className="flex justify-between items-center text-xs py-1">
              <span className="truncate mr-2">{ingredient.name}</span>
              <span className="text-green-600 font-medium">${ingredient.price.toFixed(2)}</span>
            </div>
          ))}
          {store.ingredients.length > 3 && (
            <p className="text-xs text-gray-500 mt-1">
              +{store.ingredients.length - 3} more items...
            </p>
          )}
        </div>
      </div>

      <Button
        size="sm"
        className="w-full text-white"
        style={{ 
          background: 'linear-gradient(90deg, #3d8059 0%, #5469a4 100%)'
        }}
        onClick={onStartCooking}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Select This Store
      </Button>
    </div>
  );
}

export function StoreMap({ 
  shoppingList, 
  onStoreSelect, 
  selectedStore,
  onStoreHover,
  onStartCooking
}: StoreMapProps) {
  const [hoveredStore, setHoveredStore] = useState<StoreShoppingList | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStoreHover = (store: StoreShoppingList | null) => {
    setHoveredStore(store);
    onStoreHover(store);
  };

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  const centerLat = shoppingList.user_location.lat;
  const centerLng = shoppingList.user_location.lng;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg border"
    >
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
      >
        <MapSetup />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* User location marker */}
        <Marker
          position={[centerLat, centerLng]}
          icon={new DivIcon({
            html: `
              <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #ef4444;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              "></div>
            `,
            className: 'user-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })}
        >
          <Popup>
            <div className="text-center">
              <p className="font-semibold">Your Location</p>
              <p className="text-sm text-gray-600">Shopping from here</p>
            </div>
          </Popup>
        </Marker>

        {/* Store markers */}
        {shoppingList.stores.map((store, index) => (
          <StoreMarker
            key={store.store.id}
            store={store}
            isSelected={selectedStore?.store.id === store.store.id}
            isHovered={hoveredStore?.store.id === store.store.id}
            onClick={() => onStoreSelect(store)}
            onMouseEnter={() => handleStoreHover(store)}
            onMouseLeave={() => handleStoreHover(null)}
            onStoreSelect={onStoreSelect}
            onStartCooking={onStartCooking}
          />
        ))}
      </MapContainer>
    </motion.div>
  );
}