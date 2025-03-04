
import { useState, useCallback, useEffect } from "react";
import { useRide } from "@/hooks/useRide";
import { supabase } from "@/integrations/supabase/client";
import type { Ride } from "@/types/database";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function useRideManagement() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{latitude: number, longitude: number} | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{latitude: number, longitude: number} | null>(null);
  const { requestRide, cancelRide, loading } = useRide();
  const { user } = useAuth();
  const [pendingRide, setPendingRide] = useState<Ride | null>(null);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [isDriver, setIsDriver] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [newRideRequest, setNewRideRequest] = useState<{
    pickup: string;
    destination: string;
    pickupCoords: { latitude: number; longitude: number };
    destinationCoords: { latitude: number; longitude: number };
    estimatedPrice: number;
  } | null>(null);

  // Update coordinates when addresses change
  useEffect(() => {
    if (pickup && !pickupCoords) {
      setPickupCoords(getCoordinates(pickup));
    }
    
    if (destination && !destinationCoords) {
      setDestinationCoords(getCoordinates(destination));
    }
  }, [pickup, destination, pickupCoords, destinationCoords]);

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

  // Buscar corrida pendente do passageiro
  useEffect(() => {
    if (!user?.id) return;

    const fetchPendingRide = async () => {
      console.log("Fetching pending ride for user:", user.id);
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('passenger_id', user.id)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (error) {
        console.error("Error fetching pending ride:", error);
        return;
      }

      console.log("Pending ride data:", data);
      setPendingRide(data);
    };

    fetchPendingRide();

    // Inscrever para atualizações em tempo real
    const channel = supabase
      .channel('passenger-ride')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          if (payload.eventType === 'DELETE') {
            setPendingRide(null);
          } else {
            const updatedRide = payload.new as Ride;
            if (['pending', 'accepted'].includes(updatedRide.status)) {
              setPendingRide(updatedRide);
              toast({
                title: "Status da Corrida",
                description: updatedRide.status === 'accepted' ? 
                  "Sua corrida foi aceita por um motorista!" : 
                  "Status da corrida atualizado",
              });
            } else {
              setPendingRide(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Buscar corridas disponíveis para motoristas
  useEffect(() => {
    if (!isDriver || !user?.id) return;

    const fetchAvailableRides = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .in('status', ['pending', 'accepted'])
        .eq('driver_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching driver rides:", error);
        return;
      }

      if (data) {
        // Se o motorista já tem uma corrida, não buscar outras
        setAvailableRides([]);
        return;
      }

      // Buscar corridas disponíveis se o motorista não tiver uma corrida ativa
      const { data: availableData, error: availableError } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending')
        .is('driver_id', null);

      if (availableError) {
        console.error("Error fetching available rides:", availableError);
        return;
      }

      setAvailableRides(availableData || []);
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
  }, [isDriver, user?.id]);

  const getCoordinates = useCallback((address: string) => {
    // If we have an actual map service this would be replaced with a geocoding call
    const hash = Array.from(address).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      latitude: -23.55 + (hash % 10) / 100,
      longitude: -46.63 + (hash % 10) / 100,
    };
  }, []);

  const updatePickupWithCoords = (address: string, lat: number, lng: number) => {
    setPickup(address);
    setPickupCoords({
      latitude: lat,
      longitude: lng
    });
  };

  const updateDestinationWithCoords = (address: string, lat: number, lng: number) => {
    setDestination(address);
    setDestinationCoords({
      latitude: lat,
      longitude: lng
    });
  };

  const handleRequestRide = async () => {
    if (!pickup || !destination) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o endereço de origem e destino",
        variant: "destructive",
      });
      return;
    }

    // Use existing coordinates or generate from address
    const actualPickupCoords = pickupCoords || getCoordinates(pickup);
    const actualDestinationCoords = destinationCoords || getCoordinates(destination);

    const estimatedPrice = Math.abs(
      (actualDestinationCoords.latitude - actualPickupCoords.latitude) * 100 +
      (actualDestinationCoords.longitude - actualPickupCoords.longitude) * 100
    );

    if (pendingRide) {
      setNewRideRequest({
        pickup,
        destination,
        pickupCoords: actualPickupCoords,
        destinationCoords: actualDestinationCoords,
        estimatedPrice,
      });
      setShowCancelDialog(true);
      return;
    }

    await createNewRide(pickup, destination, actualPickupCoords, actualDestinationCoords, estimatedPrice);
  };

  const createNewRide = async (
    pickup: string,
    destination: string,
    pickupCoords: { latitude: number; longitude: number },
    destinationCoords: { latitude: number; longitude: number },
    estimatedPrice: number
  ) => {
    try {
      console.log("Creating new ride with data:", {
        pickup,
        destination,
        pickupCoords,
        destinationCoords,
        estimatedPrice
      });

      const ride = await requestRide({
        pickup_latitude: pickupCoords.latitude,
        pickup_longitude: pickupCoords.longitude,
        destination_latitude: destinationCoords.latitude,
        destination_longitude: destinationCoords.longitude,
        pickup_address: pickup,
        destination_address: destination,
        estimated_price: estimatedPrice,
      });

      console.log("New ride created:", ride);
      setPendingRide(ride);
      setPickup("");
      setDestination("");
      setPickupCoords(null);
      setDestinationCoords(null);
      setNewRideRequest(null);
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Error requesting ride:", error);
      toast({
        title: "Erro",
        description: "Erro ao solicitar corrida",
        variant: "destructive",
      });
    }
  };

  const handleCancelRide = async () => {
    if (pendingRide) {
      try {
        await cancelRide(pendingRide.id);
        setPendingRide(null);
        
        if (newRideRequest) {
          await createNewRide(
            newRideRequest.pickup,
            newRideRequest.destination,
            newRideRequest.pickupCoords,
            newRideRequest.destinationCoords,
            newRideRequest.estimatedPrice
          );
        }
      } catch (error) {
        console.error("Error canceling ride:", error);
        toast({
          title: "Erro",
          description: "Erro ao cancelar corrida",
          variant: "destructive",
        });
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
    showCancelDialog,
    setShowCancelDialog,
    updatePickupWithCoords,
    updateDestinationWithCoords,
  };
}
