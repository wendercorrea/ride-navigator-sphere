
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, Clock, CheckCircle, XCircle, Car, Navigation, ArrowRight } from "lucide-react";
import { RideMap } from "@/components/RideMap";
import type { Ride } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRideDriver } from "@/hooks/ride/useRideDriver";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocationTracking } from "@/hooks/useLocationTracking";

interface PendingRideProps {
  ride: Ride;
  onCancel: () => void;
  onConclude: () => void;
  loading?: boolean;
}

type DriverInfo = {
  first_name: string;
  last_name: string;
  vehicle_model: string;
  vehicle_color: string;
  license_plate: string;
};

export function PendingRide({ ride, onCancel, onConclude, loading }: PendingRideProps) {
  const { acceptRide } = useRideDriver();
  const { user } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  
  const {
    startTracking,
    stopTracking,
    currentLocation,
    partnerLocation,
    isTracking,
  } = useLocationTracking(ride.id);
  
  useEffect(() => {
    startTracking();
    
    return () => {
      stopTracking();
    };
  }, [startTracking, stopTracking]);
  
  useEffect(() => {
    const checkIfDriver = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        setIsDriver(!!data);
      } catch (error) {
        console.error("Error checking driver status:", error);
      }
    };

    checkIfDriver();
  }, [user?.id]);

  useEffect(() => {
    const fetchDriverInfo = async () => {
      if (!ride.driver_id) return;

      try {
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('license_plate, vehicle_model, vehicle_color')
          .eq('id', ride.driver_id)
          .maybeSingle();

        if (driverError) throw driverError;

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', ride.driver_id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (driverData && profileData) {
          setDriverInfo({
            ...driverData,
            ...profileData
          });
        }
      } catch (error) {
        console.error('Error fetching driver info:', error);
      }
    };

    fetchDriverInfo();
  }, [ride.driver_id]);

  const handleAcceptRide = async () => {
    setIsAccepting(true);
    try {
      await acceptRide(ride.id);
    } finally {
      setIsAccepting(false);
    }
  };

  // Show driver location to passenger during accepted/in_progress
  // Show passenger location to driver during pending/accepted
  const showPassengerLocation = isDriver && (ride.status === 'pending' || ride.status === 'accepted');
  
  // Show driver-to-destination route when in progress for both driver and passenger
  const showDriverToDestinationRoute = ride.status === 'in_progress';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isDriver 
            ? ride.status === 'accepted' 
              ? 'Corrida Aceita' 
              : ride.status === 'in_progress' 
                ? 'Corrida em Andamento' 
                : 'Corrida Solicitada'
            : ride.status === 'accepted'
              ? 'Motorista a Caminho'
              : ride.status === 'in_progress'
                ? 'Corrida em Andamento'
                : 'Corrida Solicitada'
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(new Date(ride.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(new Date(ride.created_at), "HH:mm")}
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <MapPin className="w-5 h-5 mt-1 text-green-500" />
              <div>
                <p className="text-sm font-medium">Local de Partida</p>
                <p className="text-sm text-muted-foreground">{ride.pickup_address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Latitude: {ride.pickup_latitude.toFixed(6)}, 
                  Longitude: {ride.pickup_longitude.toFixed(6)}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="w-5 h-5 mt-1 text-red-500" />
              <div>
                <p className="text-sm font-medium">Destino</p>
                <p className="text-sm text-muted-foreground">{ride.destination_address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Latitude: {ride.destination_latitude.toFixed(6)}, 
                  Longitude: {ride.destination_longitude.toFixed(6)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Preço Estimado</p>
              <p className="text-lg font-semibold">R$ {ride.estimated_price.toFixed(2)}</p>
            </div>

            {ride.status === 'accepted' && driverInfo && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Car className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">Informações do Motorista</h3>
                </div>
                <p className="text-sm">
                  Motorista: {driverInfo.first_name} {driverInfo.last_name}
                </p>
                <p className="text-sm">
                  Veículo: {driverInfo.vehicle_model} - {driverInfo.vehicle_color}
                </p>
                <p className="text-sm">
                  Placa: {driverInfo.license_plate}
                </p>
              </div>
            )}

            {ride.status === 'accepted' && partnerLocation && !isDriver && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Car className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Motorista a caminho
                  </span>
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <ArrowRight className="w-3 h-3 mr-1 text-green-500" />
                  <span>Acompanhe a localização do motorista no mapa</span>
                </div>
              </div>
            )}
            
            {ride.status === 'in_progress' && !isDriver && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Navegação em tempo real
                  </span>
                </div>
                <p className="text-xs text-blue-600">
                  Acompanhe a rota até o destino
                </p>
              </div>
            )}

            <div className="space-y-2">
              {isDriver && ride.status === 'pending' ? (
                <>
                  <Button 
                    className="w-full"
                    onClick={handleAcceptRide}
                    disabled={isAccepting || loading}
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aceitando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aceitar Corrida
                      </>
                    )}
                  </Button>
                </>
              ) : !isDriver && ride.status === 'pending' && (
                <Button 
                  variant="destructive" 
                  onClick={onCancel} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar Solicitação de Transporte
                    </>
                  )}
                </Button>
              )}
              
              {(isDriver || ride.status !== 'pending') && (
                <Button 
                  variant="default"
                  onClick={onConclude} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {isDriver 
                        ? ride.status === 'accepted' 
                          ? "Iniciar Corrida" 
                          : "Finalizar Corrida"
                        : ride.status === 'in_progress'
                          ? "Finalizar Corrida"
                          : "Confirmar Embarque"
                      }
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="h-[400px] md:h-full relative rounded-lg overflow-hidden">
            <RideMap 
              ride={ride} 
              driverLocation={!isDriver ? partnerLocation : currentLocation}
              passengerLocation={!isDriver ? currentLocation : partnerLocation}
              trackingMode={true}
              showRoute={!showDriverToDestinationRoute}
              showDriverToDestinationRoute={showDriverToDestinationRoute}
              showPassengerLocation={showPassengerLocation}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
