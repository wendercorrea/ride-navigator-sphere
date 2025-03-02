
import { useState, useEffect } from "react";
import type { Ride } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusToggle } from "./StatusToggle";
import { AvailableRides } from "./AvailableRides";
import { CurrentRide } from "./CurrentRide";

interface DriverHomeProps {
  availableRides: Ride[];
  loading: boolean;
}

export function DriverHome({ availableRides, loading }: DriverHomeProps) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
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
      <StatusToggle 
        isOnline={isOnline} 
        setIsOnline={setIsOnline} 
        userId={user?.id} 
      />

      {acceptedRide ? (
        <>
          <h2 className="text-2xl font-bold">Sua Corrida Atual</h2>
          <CurrentRide ride={acceptedRide} loading={loading} />
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold">Corridas Disponíveis</h2>
          <AvailableRides rides={availableRides} loading={loading} />
        </>
      )}
    </div>
  );
}
