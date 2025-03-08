
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Location, LocationUpdate } from "./locationTypes";

export function useLocationSubscription(rideId: string | undefined, isDriver: boolean | null) {
  const [partnerLocation, setPartnerLocation] = useState<Location | null>(null);
  
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

  return { partnerLocation };
}
