
export interface LocationUpdate {
  driver_latitude?: number;
  driver_longitude?: number;
  passenger_latitude?: number;
  passenger_longitude?: number;
  updated_at: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface UseLocationTrackingResult {
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  currentLocation: Location | null;
  partnerLocation: Location | null;
  locationError: string | null;
  isDriver: boolean | null;
}
