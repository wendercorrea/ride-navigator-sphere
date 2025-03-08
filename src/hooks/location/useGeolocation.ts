
import { useState, useCallback } from "react";

export function useGeolocation() {
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  }, []);

  return {
    getCurrentPosition,
    locationError,
    setLocationError
  };
}
