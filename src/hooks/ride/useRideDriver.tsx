import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Ride } from '@/types/database';
import { useAuth } from '../useAuth';

export function useRideDriver() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function acceptRide(rideId: string) {
    if (!user) return;

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  async function startRide(rideId: string) {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  async function completeRide(rideId: string, finalPrice: number) {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  return {
    acceptRide,
    startRide,
    completeRide,
    loading,
  };
}
