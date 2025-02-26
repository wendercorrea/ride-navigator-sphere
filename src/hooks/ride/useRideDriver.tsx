
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../useAuth';
import { toast } from '@/components/ui/use-toast';
import type { Ride } from '@/types/database';

export function useRideDriver() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const acceptRide = async (rideId: string): Promise<Ride> => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para aceitar uma corrida',
        variant: 'destructive',
      });
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      // Verifica se o motorista está disponível
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('status')
        .eq('id', user.id)
        .maybeSingle();

      if (driverError) throw driverError;
      if (!driver) throw new Error('Perfil de motorista não encontrado');
      if (driver.status === 'on_ride') throw new Error('Você já está em uma corrida');

      // Atualiza o status da corrida
      const { data: updatedRide, error: rideError } = await supabase
        .from('rides')
        .update({ driver_id: user.id, status: 'accepted' })
        .eq('id', rideId)
        .select()
        .maybeSingle();

      if (rideError) throw rideError;
      if (!updatedRide) throw new Error('Corrida não encontrada');

      // Atualiza o status do motorista
      const { error: updateDriverError } = await supabase
        .from('drivers')
        .update({ status: 'on_ride' })
        .eq('id', user.id);

      if (updateDriverError) throw updateDriverError;

      toast({
        title: 'Sucesso',
        description: 'Corrida aceita com sucesso!',
      });

      return updatedRide;
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aceitar corrida',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const startRide = async (rideId: string): Promise<Ride> => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para iniciar uma corrida',
        variant: 'destructive',
      });
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .eq('driver_id', user.id)
        .select()
        .maybeSingle();

      if (rideError) throw rideError;
      if (!ride) throw new Error('Corrida não encontrada');

      toast({
        title: 'Sucesso',
        description: 'Corrida iniciada com sucesso!',
      });

      return ride;
    } catch (error) {
      console.error('Error starting ride:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao iniciar corrida',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeRide = async (rideId: string): Promise<Ride> => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para finalizar uma corrida',
        variant: 'destructive',
      });
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .eq('driver_id', user.id)
        .select()
        .maybeSingle();

      if (rideError) throw rideError;
      if (!ride) throw new Error('Corrida não encontrada');

      // Criar log da corrida
      const { error: logError } = await supabase
        .from('ride_logs')
        .insert({
          ride_id: ride.id,
          driver_id: ride.driver_id,
          passenger_id: ride.passenger_id,
          pickup_address: ride.pickup_address,
          destination_address: ride.destination_address,
          pickup_latitude: ride.pickup_latitude,
          pickup_longitude: ride.pickup_longitude,
          destination_latitude: ride.destination_latitude,
          destination_longitude: ride.destination_longitude,
          estimated_price: ride.estimated_price,
          final_price: ride.final_price,
          started_at: ride.started_at,
          completed_at: ride.completed_at,
          cancelled_at: ride.cancelled_at,
        });

      if (logError) throw logError;

      // Atualiza o status do motorista para disponível
      const { error: updateDriverError } = await supabase
        .from('drivers')
        .update({ status: 'online' })
        .eq('id', user.id);

      if (updateDriverError) throw updateDriverError;

      toast({
        title: 'Sucesso',
        description: 'Corrida finalizada com sucesso!',
      });

      return ride;
    } catch (error) {
      console.error('Error completing ride:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao finalizar corrida',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    acceptRide,
    startRide,
    completeRide,
    loading,
  };
}
