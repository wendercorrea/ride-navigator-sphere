
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../useAuth';
import { toast } from '@/components/ui/use-toast';

export function useRideDriver() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const acceptRide = async (rideId: string) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para aceitar uma corrida',
        variant: 'destructive',
      });
      return;
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

  return {
    acceptRide,
    loading,
  };
}
