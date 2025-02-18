
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import { useRide } from "@/hooks/useRide";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const { requestRide, loading } = useRide();

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

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-secondary to-background">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none" />

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center space-y-12">
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
      </div>
    </div>
  );
};

export default Index;
