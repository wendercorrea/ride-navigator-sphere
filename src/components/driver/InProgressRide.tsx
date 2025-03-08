
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, CheckCircle, Loader2 } from "lucide-react";
import { RideMap } from "@/components/RideMap";
import { RideStatusCard } from "@/components/ride/RideStatusCard";
import type { Ride } from "@/types/database";
import { Location } from "@/components/map/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InProgressRideProps {
  ride: Ride;
  loading: boolean;
  passengerInfo: {first_name: string; last_name: string; phone: string | null} | null;
  currentLocation: Location | null;
  partnerLocation: Location | null;
  onCompleteRide: () => void;
}

export function InProgressRide({
  ride,
  loading,
  passengerInfo,
  currentLocation,
  partnerLocation,
  onCompleteRide
}: InProgressRideProps) {
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
            
            <RideStatusCard type="in-progress" />
            
            <Button 
              onClick={onCompleteRide} 
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
