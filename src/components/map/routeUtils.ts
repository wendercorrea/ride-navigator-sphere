
import { MapLocation } from "./types";

export interface DirectionsResult {
  setMap: (map: google.maps.Map | null) => void;
  setDirections?: (directions: google.maps.DirectionsResult) => void;
}

export const createDirectionsRenderer = (
  map: google.maps.Map, 
  color: string = "#4f46e5", 
  weight: number = 5, 
  opacity: number = 0.7
): google.maps.DirectionsRenderer => {
  return new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: color,
      strokeWeight: weight,
      strokeOpacity: opacity
    }
  });
};

export const createRoute = (
  directionsService: google.maps.DirectionsService,
  origin: MapLocation,
  destination: MapLocation,
  directionsRenderer: google.maps.DirectionsRenderer,
  map: google.maps.Map,
  color: string = "#4f46e5",
  onRouteCreated?: () => void
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      directionsService.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRenderer.setDirections(result);
            console.log("Directions rendered successfully");
            if (onRouteCreated) onRouteCreated();
            
            if (map && result.routes[0]?.bounds) {
              map.fitBounds(result.routes[0].bounds, {
                top: 50, right: 50, bottom: 50, left: 50
              });
            }
            resolve(true);
          } else {
            console.warn("Failed to get directions:", status);
            
            // Check for permission errors
            if (status === "REQUEST_DENIED") {
              console.warn("Direction Service API not enabled or credentials issue");
              resolve(false);
              return;
            }
            
            // Try alternate route
            try {
              directionsService.route(
                {
                  origin,
                  destination,
                  travelMode: google.maps.TravelMode.DRIVING,
                  avoidHighways: true,
                },
                (fallbackResult, fallbackStatus) => {
                  if (fallbackStatus === "OK" && fallbackResult) {
                    directionsRenderer.setDirections(fallbackResult);
                    console.log("Directions rendered with fallback options");
                    if (onRouteCreated) onRouteCreated();
                    
                    if (map && fallbackResult.routes[0]?.bounds) {
                      map.fitBounds(fallbackResult.routes[0].bounds, {
                        top: 50, right: 50, bottom: 50, left: 50
                      });
                    }
                    resolve(true);
                  } else {
                    console.warn("All fallback attempts failed");
                    resolve(false);
                  }
                }
              );
            } catch (err) {
              console.warn("Error in fallback direction request");
              resolve(false);
            }
          }
        }
      );
    } catch (err) {
      console.error("Error in directions service:", err);
      resolve(false);
    }
  });
};
