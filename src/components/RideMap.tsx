
import { useRef } from "react";
import type { Ride } from "@/types/database";
import { useMapInitialization } from "./map/useMapInitialization";
import { MapMarkers } from "./map/MapMarkers";
import { MapRoutes } from "./map/MapRoutes";
import { MapBounds } from "./map/MapBounds";
import { MapControls } from "./map/MapControls";
import { MapStatus } from "./map/MapStatus";
import { MapSearch } from "./map/MapSearch";
import { SelectionMap } from "./map/SelectionMap";
import { RideMapProps } from "./map/types";
import { MapLoadingError } from "./map/MapLoadingError";

export function RideMap({ 
  ride, 
  onLocationSelect, 
  selectionMode = false,
  initialLocation = null,
  driverLocation = null,
  passengerLocation = null,
  showRoute = true,
  trackingMode = false,
  showDriverToDestinationRoute = false,
  showPassengerLocation = true
}: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Use selection map component if in selection mode
  if (selectionMode && onLocationSelect) {
    return (
      <SelectionMap 
        onLocationSelect={onLocationSelect}
        initialLocation={initialLocation}
      />
    );
  }
  
  // Get center location from ride if available
  const centerLocation = ride 
    ? { lat: ride.pickup_latitude, lng: ride.pickup_longitude }
    : initialLocation || undefined;
  
  // Use map initialization hook
  const { 
    map, 
    isLoading, 
    error, 
    geocoder, 
    directionsService,
    mapInitialized
  } = useMapInitialization({
    mapContainerRef: mapRef,
    center: centerLocation,
    trackingMode
  });

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      <MapLoadingError isLoading={isLoading} error={error} />
      
      {/* Add markers if map is initialized */}
      {mapInitialized && (
        <>
          <MapMarkers 
            map={map}
            ride={ride}
            driverLocation={driverLocation}
            passengerLocation={passengerLocation}
            showPassengerLocation={showPassengerLocation}
          />
          
          <MapRoutes 
            map={map}
            directionsService={directionsService}
            ride={ride}
            driverLocation={driverLocation}
            showRoute={showRoute}
            showDriverToDestinationRoute={showDriverToDestinationRoute}
          />
          
          <MapBounds 
            map={map}
            ride={ride}
            driverLocation={driverLocation}
            passengerLocation={passengerLocation}
            showPassengerLocation={showPassengerLocation}
            trackingMode={trackingMode}
          />
        </>
      )}
      
      {/* Location controls */}
      <MapControls map={map} geocoder={geocoder} />
      
      {/* Map status indicators */}
      <MapStatus 
        trackingMode={trackingMode}
        showPassengerLocation={showPassengerLocation}
        showDriverToDestinationRoute={showDriverToDestinationRoute}
      />
    </div>
  );
}
