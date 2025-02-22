
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Rating } from '@/types/database';

export function useRideActions() {
  const [loading, setLoading] = useState(false);

  async function cancelRide(rideId: string) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', rideId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Corrida cancelada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao cancelar corrida:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function rateRide(rideId: string, fromId: string, toId: string, rating: number, comment?: string) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          ride_id: rideId,
          from_id: fromId,
          to_id: toId,
          rating,
          comment,
        } as Rating);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Avaliação enviada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao avaliar corrida:', error);
      toast({
        title: 'Erro',
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
