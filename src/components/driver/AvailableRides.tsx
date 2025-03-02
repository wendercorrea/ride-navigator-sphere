
import { Card } from "@/components/ui/card";
import { PendingRide } from "@/components/PendingRide";
import type { Ride } from "@/types/database";
import { Loader2 } from "lucide-react";

interface AvailableRidesProps {
  rides: Ride[];
  loading: boolean;
}

export function AvailableRides({ rides, loading }: AvailableRidesProps) {
  if (loading) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        <p className="mt-2">Carregando corridas disponíveis...</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {rides.length > 0 ? (
        rides.map((ride) => (
          <PendingRide
            key={ride.id}
            ride={ride}
            onCancel={() => {}}
            onConclude={() => {}}
            loading={false}
          />
        ))
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhuma corrida disponível no momento. Por favor, verifique novamente mais tarde.
        </Card>
      )}
    </div>
  );
}
