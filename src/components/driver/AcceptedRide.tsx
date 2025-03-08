
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MapPin, Play, User } from "lucide-react";
import { RideMap } from "@/components/RideMap";
import { RideStatusCard } from "@/components/ride/RideStatusCard";
import type { Ride } from "@/types/database";
import { Location } from "@/components/map/types";

interface AcceptedRideProps {
  ride: Ride;
  loading: boolean;
  passengerInfo: {first_name: string; last_name: string; phone: string | null} | null;
  currentLocation: Location | null;
  partnerLocation: Location | null;
  onStartRide: () => void;
}

export function AcceptedRide({
  ride,
  loading,
  passengerInfo,
  currentLocation,
  partnerLocation,
  onStartRide
}: AcceptedRideProps) {
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
            
            {partnerLocation && (
              <RideStatusCard type="driver-approaching" />
            )}
            
            <Button 
              onClick={onStartRide} 
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
