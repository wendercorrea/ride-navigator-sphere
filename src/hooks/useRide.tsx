
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Ride } from '@/types/database';
import { useAuth } from './useAuth';

export function useRide() {
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

  async function acceptRide(rideId: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: user.id,
          status: 'accepted',
        } as Partial<Ride>)
        .eq('id', rideId)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Ride accepted successfully',
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function startRide(rideId: string) {
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        } as Partial<Ride>)
        .eq('id', rideId)
        .eq('status', 'accepted');

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Ride started successfully',
      });
    } catch (error) {
      console.error('Error starting ride:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function completeRide(rideId: string, finalPrice: number) {
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          final_price: finalPrice,
        } as Partial<Ride>)
        .eq('id', rideId)
        .eq('status', 'in_progress');

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Ride completed successfully',
      });
    } catch (error) {
      console.error('Error completing ride:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function cancelRide(rideId: string) {
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        } as Partial<Ride>)
        .eq('id', rideId)
        .or('status.eq.pending,status.eq.accepted');

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Ride cancelled successfully',
      });
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function rateRide(rideId: string, toId: string, rating: number, comment?: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          ride_id: rideId,
          from_id: user.id,
          to_id: toId,
          rating,
          comment,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Rating submitted successfully',
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  return {
    requestRide,
    acceptRide,
    startRide,
    completeRide,
    cancelRide,
    rateRide,
    loading,
  };
}
