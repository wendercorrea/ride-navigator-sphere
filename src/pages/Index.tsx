
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import { useRide } from "@/hooks/useRide";
import { toast } from "@/components/ui/use-toast";
import { PendingRide } from "@/components/PendingRide";
import { supabase } from "@/integrations/supabase/client";
import type { Ride } from "@/types/database";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
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

  // Função para simular coordenadas baseadas no endereço (em produção, usar um serviço de geocoding)
  const getCoordinates = useCallback((address: string) => {
    // Simulando coordenadas para teste
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

    // Simulando um preço estimado baseado na "distância"
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

      // Limpar os campos após solicitar a corrida
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-secondary to-background">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none" />

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-20 min-h-screen flex flex-col items-center space-y-12">
        {/* Seção de Motorista - Lista de Corridas Disponíveis */}
        {isDriver && !pendingRide && (
          <div className="w-full max-w-4xl space-y-4">
            <h2 className="text-2xl font-bold">Corridas Disponíveis</h2>
            <div className="grid grid-cols-1 gap-4">
              {availableRides.map((ride) => (
                <PendingRide
                  key={ride.id}
                  ride={ride}
                  onCancel={() => {}} // Não usado para motoristas
                  loading={loading}
                />
              ))}
              {availableRides.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  Nenhuma corrida disponível no momento.
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Seção do Passageiro */}
        {!isDriver && (
          <>
            {pendingRide ? (
              <PendingRide 
                ride={pendingRide} 
                onCancel={handleCancelRide}
                loading={loading}
              />
            ) : (
              <>
                {/* Hero Section */}
                <div className="text-center space-y-4 animate-fade-down">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    Corridas Seguras e Confiáveis
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                    Sua Jornada, Nossa Prioridade
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
                    Experimente um serviço de transporte premium com nossa plataforma de 
                    ride-hailing. Solicite sua corrida em segundos.
                  </p>
                </div>

                {/* Ride Booking Card */}
                <Card className="w-full max-w-md p-6 animate-fade-up glass-effect">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Local de partida"
                          className="pl-10"
                          value={pickup}
                          onChange={(e) => setPickup(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Para onde?"
                          className="pl-10"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handleRequestRide}
                      disabled={loading || !pickup || !destination}
                    >
                      {loading ? (
                        "Solicitando..."
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Solicitar Corrida
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12 animate-slide-up-fade">
                  {[
                    {
                      title: "Rastreamento em Tempo Real",
                      description: "Acompanhe sua corrida em tempo real com atualizações GPS",
                    },
                    {
                      title: "Corridas Seguras",
                      description: "Motoristas verificados e recursos de segurança",
                    },
                    {
                      title: "Suporte 24/7",
                      description: "Atendimento ao cliente 24 horas para sua tranquilidade",
                    },
                  ].map((feature, index) => (
                    <Card key={index} className="p-6 text-center glass-effect">
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
