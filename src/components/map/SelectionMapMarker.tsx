
import { useEffect } from "react";
import { MapLocation } from "./types";
import { createSearchLocationIcon } from "./mapUtils";

interface SelectionMapMarkerProps {
  map: google.maps.Map | null;
  mapInitialized: boolean;
  initialLocation: MapLocation | null;
  currentMarker: google.maps.Marker | null;
  setCurrentMarker: (marker: google.maps.Marker | null) => void;
}

export const SelectionMapMarker = ({
  map,
  mapInitialized,
  initialLocation,
  currentMarker,
  setCurrentMarker
}: SelectionMapMarkerProps) => {
  // Place initial marker if provided
  useEffect(() => {
    if (!map || !initialLocation || !mapInitialized) return;
    
    if (currentMarker) {
      currentMarker.setMap(null);
    }
    
    const marker = new google.maps.Marker({
      position: initialLocation,
      map,
      title: "Local selecionado",
      icon: createSearchLocationIcon(),
      animation: google.maps.Animation.DROP,
    });
    
    setCurrentMarker(marker);
    
    return () => {
      if (marker) marker.setMap(null);
    };
  }, [map, initialLocation, mapInitialized, currentMarker, setCurrentMarker]);

  return null;
};
