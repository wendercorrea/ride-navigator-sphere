
import React, { useEffect } from "react";
import type { Ride } from "@/types/database";
import { MapLocation, Location } from "./types";
import { StaticRoute } from "./StaticRoute";
import { locationToMapLocation } from "./mapUtils";
import { DynamicRoute } from "./DynamicRoute";

interface MapRoutesProps {
  map: google.maps.Map | null;
  directionsService: google.maps.DirectionsService | null;
  ride?: Ride;
  driverLocation: Location | null;
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
  // Show regular ride route from pickup to destination
  const showStaticRoute = showRoute && ride && !showDriverToDestinationRoute;
  
  // Show dynamic route from driver location to destination (only when in progress)
  const showDynamicDriverRoute = showDriverToDestinationRoute && ride && driverLocation && ride.status === 'in_progress';

  return (
    <>
      {/* Static route from pickup to destination */}
      {showStaticRoute && (
        <StaticRoute
          map={map}
          directionsService={directionsService}
          ride={ride}
          showRoute={showRoute}
        />
      )}
      
      {/* Dynamic route from driver location to destination */}
      {showDynamicDriverRoute && (
        <DynamicRoute
          map={map}
          directionsService={directionsService}
          origin={driverLocation ? locationToMapLocation(driverLocation) : undefined}
          destination={ride ? {
            lat: ride.destination_latitude,
            lng: ride.destination_longitude
          } : undefined}
          color="#4f46e5"
        />
      )}
    </>
  );
};
