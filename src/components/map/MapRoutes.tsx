
import { useEffect, useRef, useState, useCallback } from "react";
import { Ride } from "@/types/database";
import { Location, MapLocation } from "./types";
import { locationToMapLocation, handleDirectionsError, fitBounds } from "./mapUtils";

interface MapRoutesProps {
  map: google.maps.Map | null;
  directionsService: google.maps.DirectionsService | null;
  ride?: Ride;
  driverLocation?: Location | null;
  showRoute?: boolean;
  showDriverToDestinationRoute?: boolean;
}

export const MapRoutes = ({
  map,
  directionsService,
  ride,
  driverLocation,
  showRoute = true,
  showDriverToDestinationRoute = false
}: MapRoutesProps) => {
  const [routeDisplayed, setRouteDisplayed] = useState(false);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const dynamicRouteRendererRef = useRef<any>(null);
  // Track error state to prevent infinite retries
  const hasAttemptedRouteRef = useRef(false);
  const hasAttemptedDynamicRouteRef = useRef(false);

  // Create static route from pickup to destination
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

    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#4f46e5",
        strokeWeight: 5,
        strokeOpacity: 0.7
      }
    });

    directionsRendererRef.current = directionsRenderer;

    try {
      directionsService.route(
        {
          origin: pickupLocation,
          destination: destinationLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRenderer.setDirections(result);
            console.log("Directions rendered successfully");
            setRouteDisplayed(true);
            
            if (map && result.routes[0]?.bounds) {
              map.fitBounds(result.routes[0].bounds, {
                top: 50, 
                right: 50, 
                bottom: 50, 
                left: 50
              });
            }
          } else {
            console.warn("Failed to get directions:", status);
            
            // Check for permission errors specifically
            if (status === "REQUEST_DENIED") {
              console.warn("Direction Service API not enabled or credentials issue");
              handleDirectionsError(map, pickupLocation, destinationLocation);
              setRouteDisplayed(true);
              return;
            }
            
            try {
              directionsService.route(
                {
                  origin: pickupLocation,
                  destination: destinationLocation,
                  travelMode: google.maps.TravelMode.DRIVING,
                  avoidHighways: true,
                },
                (fallbackResult, fallbackStatus) => {
                  if (fallbackStatus === "OK" && fallbackResult) {
                    directionsRenderer.setDirections(fallbackResult);
                    console.log("Directions rendered with fallback options");
                    setRouteDisplayed(true);
                    
                    if (map && fallbackResult.routes[0]?.bounds) {
                      map.fitBounds(fallbackResult.routes[0].bounds, {
                        top: 50, 
                        right: 50, 
                        bottom: 50, 
                        left: 50
                      });
                    }
                  } else {
                    console.warn("All fallback attempts failed, using direct polyline");
                    
                    if (dynamicRouteRendererRef.current) {
                      dynamicRouteRendererRef.current.setMap(null);
                    }
                    
                    dynamicRouteRendererRef.current = handleDirectionsError(
                      map, 
                      pickupLocation, 
                      destinationLocation
                    );
                    console.log("Created direct polyline as fallback");
                    setRouteDisplayed(true);
                    
                    if (map) {
                      fitBounds(map, [pickupLocation, destinationLocation]);
                    }
                  }
                }
              );
            } catch (err) {
              console.warn("Error in fallback direction request, using direct polyline");
              dynamicRouteRendererRef.current = handleDirectionsError(
                map, 
                pickupLocation, 
                destinationLocation
              );
              setRouteDisplayed(true);
              
              if (map) {
                fitBounds(map, [pickupLocation, destinationLocation]);
              }
            }
          }
        }
      );
    } catch (err) {
      console.error("Error in directions service:", err);
      // Create a direct polyline as final fallback
      dynamicRouteRendererRef.current = handleDirectionsError(
        map, 
        pickupLocation, 
        destinationLocation
      );
      setRouteDisplayed(true);
    }
    
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [map, directionsService, ride, showRoute, routeDisplayed]);

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
    
    if (!dynamicRouteRendererRef.current) {
      dynamicRouteRendererRef.current = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#10b981",
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });
    }
    
    try {
      directionsService.route(
        {
          origin: driverPosition,
          destination: destinationPosition,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            dynamicRouteRendererRef.current.setDirections(result);
            console.log("Dynamic route updated successfully");
          } else {
            console.warn("Failed to get dynamic directions:", status);
            
            // Check for permission errors specifically
            if (status === "REQUEST_DENIED") {
              console.warn("Direction Service API not enabled or credentials issue");
              dynamicRouteRendererRef.current = handleDirectionsError(
                map, 
                driverPosition,
                destinationPosition,
                "#10b981"
              );
              return;
            }
            
            try {
              directionsService.route(
                {
                  origin: driverPosition,
                  destination: destinationPosition,
                  travelMode: google.maps.TravelMode.DRIVING,
                  avoidHighways: true,
                },
                (fallbackResult, fallbackStatus) => {
                  if (fallbackStatus === "OK" && fallbackResult) {
                    dynamicRouteRendererRef.current.setDirections(fallbackResult);
                    console.log("Dynamic route updated with fallback options");
                  } else {
                    console.warn("All fallback attempts failed, using direct polyline");
                    
                    if (dynamicRouteRendererRef.current) {
                      dynamicRouteRendererRef.current.setMap(null);
                    }
                    
                    dynamicRouteRendererRef.current = handleDirectionsError(
                      map, 
                      driverPosition,
                      destinationPosition,
                      "#10b981"
                    );
                  }
                }
              );
            } catch (err) {
              console.warn("Error in fallback dynamic direction request:", err);
              dynamicRouteRendererRef.current = handleDirectionsError(
                map, 
                driverPosition,
                destinationPosition,
                "#10b981"
              );
            }
          }
        }
      );
    } catch (err) {
      console.error("Error in dynamic directions request:", err);
      dynamicRouteRendererRef.current = handleDirectionsError(
        map, 
        driverPosition,
        destinationPosition,
        "#10b981"
      );
    }
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
    };
  }, [
    map, 
    directionsService, 
    driverLocation, 
    ride, 
    showDriverToDestinationRoute, 
    updateDynamicRoute
  ]);

  return null; // This is a non-visual component
};
