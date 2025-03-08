import { useEffect, useRef, useCallback } from "react";
import { Ride } from "@/types/database";
import { Location, MapLocation } from "./types";
import { locationToMapLocation, handleDirectionsError } from "./mapUtils";
import { createDirectionsRenderer, createRoute } from "./routeUtils";

interface DynamicRouteProps {
  map: google.maps.Map | null;
  directionsService: google.maps.DirectionsService | null;
  ride?: Ride;
  driverLocation?: Location | null;
  origin?: MapLocation;
  destination?: MapLocation;
  color?: string;
  showDriverToDestinationRoute?: boolean;
}

export const DynamicRoute = ({
  map,
  directionsService,
  ride,
  driverLocation,
  origin,
  destination,
  color = "#10b981",
  showDriverToDestinationRoute = false
}: DynamicRouteProps) => {
  const dynamicRouteRendererRef = useRef<any>(null);
  const hasAttemptedDynamicRouteRef = useRef(false);
  const polylineRef = useRef<any>(null);

  // Create dynamic route from driver to destination
  const updateDynamicRoute = useCallback(() => {
    // If we have direct origin and destination props, use those
    if (origin && destination && map && directionsService) {
      console.log("Using direct origin/destination props for dynamic route:", origin, destination);
      
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      
      if (!dynamicRouteRendererRef.current) {
        dynamicRouteRendererRef.current = createDirectionsRenderer(map, color);
      }
      
      createRoute(
        directionsService, 
        origin, 
        destination, 
        dynamicRouteRendererRef.current, 
        map, 
        color
      ).then(success => {
        if (!success) {
          console.warn("All fallback attempts failed, using direct polyline");
          if (polylineRef.current) {
            polylineRef.current.setMap(null);
          }
          
          polylineRef.current = handleDirectionsError(
            map, 
            origin,
            destination,
            color
          );
        }
      });
      
      return;
    }
    
    // Otherwise use the legacy approach with ride and driverLocation
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
      dynamicRouteRendererRef.current = createDirectionsRenderer(map, color);
    }
    
    createRoute(
      directionsService, 
      driverPosition, 
      destinationPosition, 
      dynamicRouteRendererRef.current, 
      map, 
      color
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
          color
        );
      }
    });
  }, [map, directionsService, ride, driverLocation, origin, destination, color]);

  // Update dynamic route when properties change
  useEffect(() => {
    // Direct props approach
    if (origin && destination) {
      updateDynamicRoute();
    }
    // Legacy approach
    else if (showDriverToDestinationRoute && driverLocation && ride && map && directionsService) {
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
    origin,
    destination,
    updateDynamicRoute
  ]);

  return null;
};
