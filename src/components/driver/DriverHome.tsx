
import { Card } from "@/components/ui/card";
import { PendingRide } from "@/components/PendingRide";
import type { Ride } from "@/types/database";

interface DriverHomeProps {
  availableRides: Ride[];
  loading: boolean;
}

export function DriverHome({ availableRides, loading }: DriverHomeProps) {
  return (
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
  );
}
