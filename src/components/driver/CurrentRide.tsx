
import { PendingRide } from "@/components/PendingRide";
import type { Ride } from "@/types/database";
import { useRideDriver } from "@/hooks/ride/useRideDriver";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { CheckCircle, Loader2, Play } from "lucide-react";
import { RideMap } from "@/components/RideMap";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CurrentRideProps {
  ride: Ride;
  loading: boolean;
}

export function CurrentRide({ ride, loading }: CurrentRideProps) {
  const { startRide, completeRide } = useRideDriver();

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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">Passageiro está aguardando</p>
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
              <RideMap ride={ride} />
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">Corrida iniciada em</p>
                <p className="text-sm">
                  {ride.started_at && format(new Date(ride.started_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-sm mt-2">
                  Destino: {ride.destination_address}
                </p>
                <p className="text-sm font-medium mt-2">
                  Preço estimado: R$ {ride.estimated_price.toFixed(2)}
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
              <RideMap ride={ride} />
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
