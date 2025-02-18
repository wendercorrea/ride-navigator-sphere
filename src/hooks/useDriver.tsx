
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Driver } from '@/types/database';
import { useAuth } from './useAuth';

export function useDriver() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function registerAsDriver(driverData: Omit<Driver, 'id' | 'status' | 'rating' | 'created_at' | 'updated_at'>) {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to register as a driver',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .insert({
          id: user.id,
          ...driverData,
          status: 'offline',
        } as Driver);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'You are now registered as a driver',
      });
    } catch (error) {
      console.error('Error registering as driver:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateLocation(latitude: number, longitude: number) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
        } as Partial<Driver>)
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  async function updateStatus(status: Driver['status']) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status } as Partial<Driver>)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `You are now ${status}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  return {
    registerAsDriver,
    updateLocation,
    updateStatus,
    loading,
  };
}
