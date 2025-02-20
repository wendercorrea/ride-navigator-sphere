import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Ride } from '@/types/database';
import { useAuth } from '../useAuth';

export function useRideActions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function cancelRide(rideId: string) {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  async function rateRide(rideId: string, toId: string, rating: number, comment?: string) {
    if (!user) return;

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  return {
    cancelRide,
    rateRide,
    loading,
  };
}
