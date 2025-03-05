import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

export interface LocationUpdate {
  driver_latitude?: number;
  driver_longitude?: number;
  passenger_latitude?: number;
  passenger_longitude?: number;
  updated_at: string;
}

export function useLocationTracking(rideId?: string) {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDriver, setIsDriver] = useState<boolean | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Check if the user is a driver
  useEffect(() => {
    const checkIfDriver = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        setIsDriver(!!data);
      } catch (error) {
        console.error("Error checking driver status:", error);
        setIsDriver(false);
      }
    };

    checkIfDriver();
  }, [user?.id]);

  // Subscribe to location updates for the ride
  useEffect(() => {
    if (!rideId || isDriver === null) return;
    
    console.log(`Subscribing to location updates for ride ${rideId}`);
    
    const channel = supabase
      .channel(`ride_locations_${rideId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_location_updates',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          console.log('Location update received:', payload);
          const locationUpdate = payload.new as LocationUpdate;
          
          if (isDriver) {
            // Driver receives passenger location
            if (locationUpdate.passenger_latitude && locationUpdate.passenger_longitude) {
              setPartnerLocation({
                latitude: locationUpdate.passenger_latitude,
                longitude: locationUpdate.passenger_longitude,
              });
            }
          } else {
            // Passenger receives driver location
            if (locationUpdate.driver_latitude && locationUpdate.driver_longitude) {
              setPartnerLocation({
                latitude: locationUpdate.driver_latitude,
                longitude: locationUpdate.driver_longitude,
              });
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      console.log(`Unsubscribing from location updates for ride ${rideId}`);
      supabase.removeChannel(channel);
    };
  }, [rideId, isDriver]);

  // Function to get current location from browser
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

  // Function to update location on server
  const updateLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!user?.id || !rideId) return;
    
    try {
      const { error } = await supabase.functions.invoke('update-location', {
        body: {
          userId: user.id,
          latitude,
          longitude,
          rideId,
          userType: isDriver ? 'driver' : 'passenger',
        },
      });
      
      if (error) throw error;
      
      lastLocationRef.current = { latitude, longitude };
      
    } catch (error) {
      console.error('Error updating location:', error);
      setLocationError(`Failed to update location: ${error.message}`);
    }
  }, [user?.id, rideId, isDriver]);

  // Update location data in the UI state (separate from server updates)
  const updateLocationState = useCallback(() => {
    if (lastLocationRef.current) {
      setCurrentLocation(lastLocationRef.current);
    }
  }, []);

  // Start tracking location
  const startTracking = useCallback(() => {
    if (isTracking || !user?.id || !rideId) return;
    
    setIsTracking(true);
    setLocationError(null);
    
    const trackLocation = async () => {
      try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        await updateLocation(latitude, longitude);
        console.log(`Location updated: ${latitude}, ${longitude}`);
      } catch (error) {
        console.error('Error tracking location:', error);
        setLocationError(`Unable to track location: ${error.message}`);
        
        toast({
          title: "Erro na Localização",
          description: `Não foi possível obter sua localização: ${error.message}`,
          variant: "destructive",
        });
      }
    };
    
    // Update location data immediately
    trackLocation();
    
    // Set up interval for regular location data updates (every 3 seconds)
    const dataInterval = setInterval(trackLocation, 3000);
    locationUpdateIntervalRef.current = dataInterval;
    
    // Set up separate interval for UI updates (every 30 seconds instead of 15)
    const uiInterval = setInterval(updateLocationState, 30000);
    mapUpdateIntervalRef.current = uiInterval;
    
    return () => {
      if (dataInterval) clearInterval(dataInterval);
      if (uiInterval) clearInterval(uiInterval);
    };
  }, [isTracking, user?.id, rideId, getCurrentPosition, updateLocation, updateLocationState]);

  // Stop tracking location
  const stopTracking = useCallback(() => {
    if (!isTracking) return;
    
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
    
    if (mapUpdateIntervalRef.current) {
      clearInterval(mapUpdateIntervalRef.current);
      mapUpdateIntervalRef.current = null;
    }
    
    setIsTracking(false);
    console.log('Location tracking stopped');
  }, [isTracking]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
      if (mapUpdateIntervalRef.current) {
        clearInterval(mapUpdateIntervalRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    startTracking,
    stopTracking,
    currentLocation,
    partnerLocation,
    locationError,
    isDriver,
  };
}
