
import { useState, useCallback, useEffect } from "react";
import { useRide } from "@/hooks/useRide";
import { supabase } from "@/integrations/supabase/client";
import type { Ride } from "@/types/database";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function useRideManagement() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const { requestRide, cancelRide, loading } = useRide();
  const { user } = useAuth();
  const [pendingRide, setPendingRide] = useState<Ride | null>(null);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [isDriver, setIsDriver] = useState(false);

  // Verificar se o usuário é motorista
  useEffect(() => {
    const checkIfDriver = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("id")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setIsDriver(!!data);
      } catch (error) {
        console.error("Error checking driver status:", error);
      }
    };

    checkIfDriver();
  }, [user?.id]);

  // Buscar corridas disponíveis para motoristas
  useEffect(() => {
    if (!isDriver) return;

    const fetchAvailableRides = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending')
        .is('driver_id', null);

      if (error) {
        console.error("Error fetching available rides:", error);
        return;
      }

      setAvailableRides(data);
    };

    fetchAvailableRides();

    // Inscrever para atualizações em tempo real
    const channel = supabase
      .channel('available-rides')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `status=eq.pending`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setAvailableRides(prev => prev.filter(ride => ride.id !== payload.old.id));
          } else {
            const ride = payload.new as Ride;
            if (ride.status === 'pending' && !ride.driver_id) {
              setAvailableRides(prev => {
                const exists = prev.some(r => r.id === ride.id);
                if (!exists) {
                  return [...prev, ride];
                }
                return prev.map(r => r.id === ride.id ? ride : r);
              });
            } else {
              setAvailableRides(prev => prev.filter(r => r.id !== ride.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDriver]);

  // Função para simular coordenadas baseadas no endereço
  const getCoordinates = useCallback((address: string) => {
    const hash = Array.from(address).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      latitude: -23.55 + (hash % 10) / 100,
      longitude: -46.63 + (hash % 10) / 100,
    };
  }, []);

  const handleRequestRide = async () => {
    if (!pickup || !destination) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o endereço de origem e destino",
        variant: "destructive",
      });
      return;
    }

    const pickupCoords = getCoordinates(pickup);
    const destinationCoords = getCoordinates(destination);

    const estimatedPrice = Math.abs(
      (destinationCoords.latitude - pickupCoords.latitude) * 100 +
      (destinationCoords.longitude - pickupCoords.longitude) * 100
    );

    try {
      await requestRide({
        pickup_latitude: pickupCoords.latitude,
        pickup_longitude: pickupCoords.longitude,
        destination_latitude: destinationCoords.latitude,
        destination_longitude: destinationCoords.longitude,
        pickup_address: pickup,
        destination_address: destination,
        estimated_price: estimatedPrice,
      });

      setPickup("");
      setDestination("");
    } catch (error) {
      console.error("Error requesting ride:", error);
    }
  };

  const handleCancelRide = async () => {
    if (pendingRide) {
      try {
        await cancelRide(pendingRide.id);
        setPendingRide(null);
      } catch (error) {
        console.error("Error canceling ride:", error);
      }
    }
  };

  return {
    pickup,
    setPickup,
    destination,
    setDestination,
    loading,
    pendingRide,
    availableRides,
    isDriver,
    handleRequestRide,
    handleCancelRide,
  };
}
