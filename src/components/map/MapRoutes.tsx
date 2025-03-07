
import { StaticRoute } from "./StaticRoute";
import { DynamicRoute } from "./DynamicRoute";
import { Ride } from "@/types/database";
import { Location } from "./types";

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
  return (
    <>
      <StaticRoute
        map={map}
        directionsService={directionsService}
        ride={ride}
        showRoute={showRoute}
      />
      
      <DynamicRoute
        map={map}
        directionsService={directionsService}
        ride={ride}
        driverLocation={driverLocation}
        showDriverToDestinationRoute={showDriverToDestinationRoute}
      />
    </>
  );
};
