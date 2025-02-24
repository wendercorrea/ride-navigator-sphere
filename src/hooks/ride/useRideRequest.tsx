
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
  }): Promise<Ride> {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para solicitar uma corrida',
        variant: 'destructive',
      });
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      // Primeiro, verifica se o perfil do usuário existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil de usuário não encontrado. Por favor, faça login novamente.');
      }

      // Se o perfil existe, cria a corrida
      const { data, error } = await supabase
        .from('rides')
        .insert({
          passenger_id: user.id,
          ...rideData,
          status: 'pending',
        } as Ride)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from ride creation');

      toast({
        title: 'Sucesso',
        description: 'Corrida solicitada com sucesso',
      });

      return data;
    } catch (error) {
      console.error('Erro ao solicitar corrida:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    requestRide,
    loading,
  };
}
