
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { useGeolocation } from "./useGeolocation";
import { useDriverStatus } from "./useDriverStatus";
import { useLocationSubscription } from "./useLocationSubscription";
import { Location, UseLocationTrackingResult } from "./locationTypes";

export function useLocationTracking(rideId?: string): UseLocationTrackingResult {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const lastLocationRef = useRef<Location | null>(null);
  
  const { getCurrentPosition, locationError, setLocationError } = useGeolocation();
  const { isDriver } = useDriverStatus();
  const { partnerLocation } = useLocationSubscription(rideId, isDriver);

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
      
      // Immediately update the current location in state to avoid delay
      const newLocation = { latitude, longitude };
      lastLocationRef.current = newLocation;
      setCurrentLocation(newLocation);
      
    } catch (error) {
      console.error('Error updating location:', error);
      setLocationError(`Failed to update location: ${error.message}`);
    }
  }, [user?.id, rideId, isDriver, setLocationError]);

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
    
    return () => {
      if (dataInterval) clearInterval(dataInterval);
    };
  }, [isTracking, user?.id, rideId, getCurrentPosition, updateLocation, setLocationError]);

  // Stop tracking location
  const stopTracking = useCallback(() => {
    if (!isTracking) return;
    
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
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
