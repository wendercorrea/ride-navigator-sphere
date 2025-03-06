
import { useEffect } from "react";
import { Ride } from "@/types/database";
import { Location } from "./types";
import { locationToMapLocation } from "./mapUtils";

interface MapBoundsProps {
  map: google.maps.Map | null;
  ride?: Ride;
  driverLocation?: Location | null;
  passengerLocation?: Location | null;
  showPassengerLocation?: boolean;
  trackingMode?: boolean;
}

export const MapBounds = ({
  map,
  ride,
  driverLocation,
  passengerLocation,
  showPassengerLocation = true,
  trackingMode = false
}: MapBoundsProps) => {
  // Update map bounds to fit all markers
  useEffect(() => {
    if (!trackingMode || !map || !ride || !driverLocation) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    // Add driver location to bounds
    bounds.extend(locationToMapLocation(driverLocation));
    
    // Add ride destination to bounds
    bounds.extend({
      lat: ride.destination_latitude, 
      lng: ride.destination_longitude
    });
    
    // Add passenger location to bounds if shown
    if (passengerLocation && showPassengerLocation) {
      bounds.extend(locationToMapLocation(passengerLocation));
    }
    
    if (bounds.isEmpty()) return;
    
    // Only fit bounds if there are significant changes to avoid constant zooming
    map.fitBounds(bounds, {
      top: 60, 
      right: 60, 
      bottom: 60, 
      left: 60
    });
  }, [map, ride, driverLocation, passengerLocation, showPassengerLocation, trackingMode]);

  return null; // This is a non-visual component
};
