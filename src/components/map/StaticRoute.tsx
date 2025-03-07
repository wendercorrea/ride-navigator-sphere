
import { useEffect, useRef, useState } from "react";
import { Ride } from "@/types/database";
import { MapLocation } from "./types";
import { handleDirectionsError } from "./mapUtils";
import { createDirectionsRenderer, createRoute } from "./routeUtils";

interface StaticRouteProps {
  map: google.maps.Map | null;
  directionsService: google.maps.DirectionsService | null;
  ride?: Ride;
  showRoute?: boolean;
}

export const StaticRoute = ({
  map,
  directionsService,
  ride,
  showRoute = true
}: StaticRouteProps) => {
  const [routeDisplayed, setRouteDisplayed] = useState(false);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const polylineRef = useRef<any>(null);
  const hasAttemptedRouteRef = useRef(false);

  useEffect(() => {
    if (!map || !directionsService || !ride || !showRoute || routeDisplayed || hasAttemptedRouteRef.current) return;
    
    hasAttemptedRouteRef.current = true;
    
    const pickupLocation = {
      lat: ride.pickup_latitude,
      lng: ride.pickup_longitude,
    };

    const destinationLocation = {
      lat: ride.destination_latitude,
      lng: ride.destination_longitude,
    };
    
    console.log("Creating static route from pickup to destination:", pickupLocation, destinationLocation);

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const directionsRenderer = createDirectionsRenderer(map, "#4f46e5");
    directionsRendererRef.current = directionsRenderer;

    createRoute(
      directionsService, 
      pickupLocation, 
      destinationLocation, 
      directionsRenderer, 
      map, 
      "#4f46e5", 
      () => setRouteDisplayed(true)
    ).then(success => {
      if (!success) {
        // Use direct polyline as fallback
        console.warn("All fallback attempts failed, using direct polyline");
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }
        
        polylineRef.current = handleDirectionsError(
          map, 
          pickupLocation, 
          destinationLocation
        );
        setRouteDisplayed(true);
      }
    });
    
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, directionsService, ride, showRoute, routeDisplayed]);

  return null;
};
