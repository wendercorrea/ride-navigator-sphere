
import { useEffect, useRef, useCallback } from "react";
import { Ride } from "@/types/database";
import { Location } from "./types";
import { locationToMapLocation, handleDirectionsError } from "./mapUtils";
import { createDirectionsRenderer, createRoute } from "./routeUtils";

interface DynamicRouteProps {
  map: google.maps.Map | null;
  directionsService: google.maps.DirectionsService | null;
  ride?: Ride;
  driverLocation?: Location | null;
  showDriverToDestinationRoute?: boolean;
}

export const DynamicRoute = ({
  map,
  directionsService,
  ride,
  driverLocation,
  showDriverToDestinationRoute = false
}: DynamicRouteProps) => {
  const dynamicRouteRendererRef = useRef<any>(null);
  const hasAttemptedDynamicRouteRef = useRef(false);
  const polylineRef = useRef<any>(null);

  // Create dynamic route from driver to destination
  const updateDynamicRoute = useCallback(() => {
    if (!map || !directionsService || !ride || !driverLocation || hasAttemptedDynamicRouteRef.current) {
      console.log("Missing requirements for dynamic route update or already attempted");
      return;
    }
    
    hasAttemptedDynamicRouteRef.current = true;
    
    const driverPosition = locationToMapLocation(driverLocation);
    
    const destinationPosition = {
      lat: ride.destination_latitude,
      lng: ride.destination_longitude
    };
    
    console.log("Updating dynamic route from driver to destination:", driverPosition, destinationPosition);
    
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    
    if (!dynamicRouteRendererRef.current) {
      dynamicRouteRendererRef.current = createDirectionsRenderer(map, "#10b981");
    }
    
    createRoute(
      directionsService, 
      driverPosition, 
      destinationPosition, 
      dynamicRouteRendererRef.current, 
      map, 
      "#10b981"
    ).then(success => {
      if (!success) {
        // Use direct polyline as fallback
        console.warn("All fallback attempts failed, using direct polyline");
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }
        
        polylineRef.current = handleDirectionsError(
          map, 
          driverPosition,
          destinationPosition,
          "#10b981"
        );
      }
    });
  }, [map, directionsService, ride, driverLocation]);

  // Update dynamic route when driver location changes
  useEffect(() => {
    if (showDriverToDestinationRoute && driverLocation && ride && map && directionsService) {
      // Reset the flag when driver location or ride changes
      hasAttemptedDynamicRouteRef.current = false;
      updateDynamicRoute();
    }
    
    return () => {
      if (dynamicRouteRendererRef.current) {
        dynamicRouteRendererRef.current.setMap(null);
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [
    map, 
    directionsService, 
    driverLocation, 
    ride, 
    showDriverToDestinationRoute, 
    updateDynamicRoute
  ]);

  return null;
};
