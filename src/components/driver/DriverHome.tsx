import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PendingRide } from "@/components/PendingRide";
import type { Ride } from "@/types/database";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useRideDriver } from "@/hooks/ride/useRideDriver";

interface DriverHomeProps {
  availableRides: Ride[];
  loading: boolean;
}

export function DriverHome({ availableRides, loading }: DriverHomeProps) {
  const { user } = useAuth();
  const { startRide, completeRide } = useRideDriver();
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [initialStatusLoaded, setInitialStatusLoaded] = useState(false);
  const [acceptedRide, setAcceptedRide] = useState<Ride | null>(null);

  useEffect(() => {
    const fetchDriverStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('status')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        setIsOnline(data?.status === 'online');
        setInitialStatusLoaded(true);
      } catch (error) {
        console.error('Error fetching driver status:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o status do motorista",
          variant: "destructive",
        });
      }
    };

    fetchDriverStatus();
  }, [user]);

  useEffect(() => {
    const fetchAcceptedRide = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('driver_id', user.id)
          .in('status', ['accepted', 'in_progress'])
          .maybeSingle();

        if (error) throw error;
        setAcceptedRide(data);
      } catch (error) {
        console.error('Error fetching accepted ride:', error);
      }
    };

    fetchAcceptedRide();

    const channel = supabase
      .channel('driver-rides')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          if (payload.eventType === 'DELETE') {
            setAcceptedRide(null);
          } else {
            const ride = payload.new as Ride;
            if (['accepted', 'in_progress'].includes(ride.status)) {
              setAcceptedRide(ride);
            } else {
              setAcceptedRide(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateDriverStatus = async (online: boolean) => {
    if (!user) return;

    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: online ? 'online' : 'offline' })
        .eq('id', user.id);

      if (error) throw error;

      setIsOnline(online);
      toast({
        title: "Status Atualizado",
        description: `Você está ${online ? 'online' : 'offline'}`,
      });
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
      setIsOnline(!online);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStartRide = async () => {
    if (!acceptedRide) return;
    try {
      const updatedRide = await startRide(acceptedRide.id);
      setAcceptedRide(updatedRide);
    } catch (error) {
      console.error('Error starting ride:', error);
    }
  };

  const handleCompleteRide = async () => {
    if (!acceptedRide) return;
    try {
      await completeRide(acceptedRide.id);
      setAcceptedRide(null);
    } catch (error) {
      console.error('Error completing ride:', error);
    }
  };

  if (!initialStatusLoaded) {
    return (
      <div className="w-full max-w-4xl space-y-4">
        <Card className="p-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="mt-2">Carregando status...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="driver-status" className="text-base">Status do Motorista</Label>
            <p className="text-sm text-muted-foreground">
              {isOnline ? "Você está disponível para corridas" : "Você está offline"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="driver-status"
              checked={isOnline}
              onCheckedChange={updateDriverStatus}
              disabled={isUpdatingStatus}
            />
          </div>
        </div>
      </Card>

      {acceptedRide ? (
        <>
          <h2 className="text-2xl font-bold">Sua Corrida Atual</h2>
          <PendingRide
            key={acceptedRide.id}
            ride={acceptedRide}
            onCancel={() => {}} // Não usado para motoristas
            onConclude={acceptedRide.status === 'accepted' ? handleStartRide : handleCompleteRide}
            loading={loading}
          />
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold">Corridas Disponíveis</h2>
          {loading ? (
            <Card className="p-8 text-center text-muted-foreground">
              Carregando corridas disponíveis...
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {availableRides.length > 0 ? (
                availableRides.map((ride) => (
                  <PendingRide
                    key={ride.id}
                    ride={ride}
                    onCancel={() => {}}
                    onConclude={() => {}}
                    loading={loading}
                  />
                ))
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  Nenhuma corrida disponível no momento. Por favor, verifique novamente mais tarde.
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
