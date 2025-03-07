
import { useEffect, useRef, useState } from "react";
import { MapLocation } from "./types";
import { useMapInitialization } from "./useMapInitialization";
import { MapSearch } from "./MapSearch";
import { MapControls } from "./MapControls";
import { createSearchLocationIcon } from "./mapUtils";
import { MapLoadingError } from "./MapLoadingError";
import { SelectionMapMarker } from "./SelectionMapMarker";

interface SelectionMapProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLocation?: MapLocation | null;
  selectionMode?: "origin" | "destination"; // Added selection mode
}

export const SelectionMap = ({
  onLocationSelect,
  initialLocation = null,
  selectionMode = "origin" // Default to origin selection
}: SelectionMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);
  
  const { 
    map, 
    isLoading, 
    error, 
    geocoder,
    mapInitialized
  } = useMapInitialization({
    mapContainerRef: mapRef,
    center: initialLocation || undefined
  });
  
  // Set up map click listener for location selection
  useEffect(() => {
    if (!map || !geocoder || !mapInitialized) return;
    
    const clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (currentMarker) {
        currentMarker.setMap(null);
      }
      
      const position = e.latLng!;
      const marker = new google.maps.Marker({
        position,
        map,
        title: selectionMode === "origin" ? "Local de origem" : "Local de destino",
        icon: createSearchLocationIcon(),
        animation: google.maps.Animation.DROP,
      });
      
      setCurrentMarker(marker);
      
      geocoder.geocode({ location: position }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const address = results[0].formatted_address;
          onLocationSelect(position.lat(), position.lng(), address);
        }
      });
    });
    
    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, geocoder, mapInitialized, currentMarker, onLocationSelect, selectionMode]);
  
  // Handle place selection from search
  const handlePlaceSelected = (lat: number, lng: number, address: string) => {
    if (currentMarker) {
      currentMarker.setMap(null);
    }
    
    if (map) {
      const position = { lat, lng };
      const marker = new google.maps.Marker({
        position,
        map,
        title: selectionMode === "origin" ? "Local de origem" : "Local de destino",
        icon: createSearchLocationIcon(),
        animation: google.maps.Animation.DROP,
      });
      
      setCurrentMarker(marker);
      onLocationSelect(lat, lng, address);
    }
  };
  
  return (
    <div className="relative w-full h-full">
      <MapSearch 
        map={map} 
        selectionMode={true} 
        onPlaceSelected={handlePlaceSelected}
      />
      
      <div ref={mapRef} className="w-full h-full" />
      
      <MapLoadingError isLoading={isLoading} error={error} />
      
      <SelectionMapMarker
        map={map}
        mapInitialized={mapInitialized}
        initialLocation={initialLocation}
        currentMarker={currentMarker}
        setCurrentMarker={setCurrentMarker}
        selectionMode={selectionMode}
      />
      
      <MapControls 
        map={map} 
        geocoder={geocoder} 
        onLocationSelected={onLocationSelect}
        selectionMode={true}
      />
    </div>
  );
};
