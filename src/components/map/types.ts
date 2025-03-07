
import type { Ride } from "@/types/database";

export interface Location {
  latitude: number;
  longitude: number;
}

export interface MapLocation {
  lat: number;
  lng: number;
}

export interface RideMapProps {
  ride?: Ride;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  selectionMode?: boolean;
  initialLocation?: MapLocation | null;
  driverLocation?: Location | null;
  passengerLocation?: Location | null;
  showRoute?: boolean;
  trackingMode?: boolean;
  showDriverToDestinationRoute?: boolean;
  showPassengerLocation?: boolean;
  locationSelectionType?: "origin" | "destination";
}
