
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Ride } from '@/types/database';
import { useAuth } from '../useAuth';

export function useRideRequest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function requestRide(rideData: {
    pickup_latitude: number;
    pickup_longitude: number;
    destination_latitude: number;
    destination_longitude: number;
    pickup_address: string;
    destination_address: string;
    estimated_price: number;
  }) {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to request a ride',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('rides')
        .insert({
          passenger_id: user.id,
          ...rideData,
          status: 'pending',
        } as Ride);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Ride requested successfully',
      });
    } catch (error) {
      console.error('Error requesting ride:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    requestRide,
    loading,
  };
}
