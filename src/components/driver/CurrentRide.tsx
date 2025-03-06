import { PendingRide } from "@/components/PendingRide";
import type { Ride } from "@/types/database";
import { useRideDriver } from "@/hooks/ride/useRideDriver";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; 
import { CheckCircle, Loader2, Play, User, Car, MapPin, Navigation, ArrowRight } from "lucide-react";
import { RideMap } from "@/components/RideMap";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocationTracking } from "@/hooks/useLocationTracking";

interface CurrentRideProps {
  ride: Ride;
  loading: boolean;
}

export function CurrentRide({ ride, loading }: CurrentRideProps) {
  const { startRide, completeRide } = useRideDriver();
  const [passengerInfo, setPassengerInfo] = useState<{first_name: string; last_name: string; phone: string | null} | null>(null);
  
  const {
    startTracking,
    stopTracking,
    currentLocation,
    partnerLocation,
    isTracking,
  } = useLocationTracking(ride.id);
  
  // Start location tracking when the component mounts
  useEffect(() => {
    startTracking();
    
    return () => {
      stopTracking();
    };
  }, [startTracking, stopTracking]);

  useEffect(() => {
    const fetchPassengerInfo = async () => {
      if (!ride?.passenger_id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', ride.passenger_id)
          .single();
          
        if (error) throw error;
        setPassengerInfo(data);
      } catch (error) {
        console.error('Error fetching passenger info:', error);
      }
    };
    
    fetchPassengerInfo();
  }, [ride?.passenger_id]);

  const handleStartRide = async () => {
    if (!ride) return;
    try {
      const updatedRide = await startRide(ride.id);
      console.log("Ride started:", updatedRide);
    } catch (error) {
      console.error('Error starting ride:', error);
    }
  };

  const handleCompleteRide = async () => {
    if (!ride) return;
    try {
      await completeRide(ride.id);
    } catch (error) {
      console.error('Error completing ride:', error);
    }
  };

  if (ride.status === 'accepted') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Corrida Aceita</CardTitle>
          <CardDescription>
            O passageiro está aguardando sua chegada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {passengerInfo && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-primary" />
                    <p className="font-medium">Informações do Passageiro</p>
                  </div>
                  <p className="text-sm">
                    Nome: {passengerInfo.first_name} {passengerInfo.last_name}
                  </p>
                  {passengerInfo.phone && (
                    <p className="text-sm">
                      Telefone: {passengerInfo.phone}
                    </p>
                  )}
                </div>
              )}
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <p className="font-medium">Detalhes da Corrida</p>
                </div>
                <p className="text-sm mt-2">
                  Endereço de embarque: {ride.pickup_address}
                </p>
                <p className="text-sm mt-1">
                  Destino: {ride.destination_address}
                </p>
                <p className="text-sm font-medium mt-2">
                  Preço estimado: R$ {ride.estimated_price.toFixed(2)}
                </p>
              </div>
              
              {/* Status de deslocamento do motorista para o passageiro */}
              {partnerLocation && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Car className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Deslocando para o passageiro
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <ArrowRight className="w-3 h-3 mr-1 text-green-500" />
                    <span>Use o mapa para navegar até o ponto de embarque</span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleStartRide} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar Corrida
                  </>
                )}
              </Button>
            </div>
            <div className="h-[300px] md:h-full relative rounded-lg overflow-hidden">
              <RideMap 
                ride={ride} 
                driverLocation={currentLocation}
                passengerLocation={partnerLocation}
                trackingMode={true}
                showRoute={true}
                showDriverToDestinationRoute={false}
                showPassengerLocation={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ride.status === 'in_progress') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Corrida em Andamento</CardTitle>
          {passengerInfo && (
            <CardDescription>
              Passageiro: {passengerInfo.first_name} {passengerInfo.last_name}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="h-5 w-5 text-primary" />
                  <p className="font-medium">Informações da Corrida</p>
                </div>
                <p className="text-sm">
                  Iniciada em: {ride.started_at && format(new Date(ride.started_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-sm mt-2">
                  Destino: {ride.destination_address}
                </p>
                <p className="text-sm font-medium mt-2">
                  Preço estimado: R$ {ride.estimated_price.toFixed(2)}
                </p>
              </div>
              
              {/* Agora exibe informação sobre a rota ativa */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Navegação em tempo real
                  </span>
                </div>
                <p className="text-xs text-blue-600">
                  Rota ativa até o destino
                </p>
              </div>
              
              <Button 
                onClick={handleCompleteRide} 
                disabled={loading}
                className="w-full"
                variant="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finalizar Corrida
                  </>
                )}
              </Button>
            </div>
            <div className="h-[300px] md:h-full relative rounded-lg overflow-hidden">
              <RideMap 
                ride={ride}
                driverLocation={currentLocation}
                passengerLocation={partnerLocation}
                trackingMode={true}
                showRoute={true}
                showDriverToDestinationRoute={true}
                showPassengerLocation={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback para outros estados (não deve acontecer, mas é bom ter)
  return (
    <PendingRide
      key={ride.id}
      ride={ride}
      onCancel={() => {}} 
      onConclude={() => {
        // Determine qual função chamar com base no status atual
        if (ride.status === 'accepted') {
          handleStartRide();
        } else if (ride.status === 'in_progress') {
          handleCompleteRide();
        }
      }}
      loading={loading}
    />
  );
}
