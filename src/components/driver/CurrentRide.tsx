
import { PendingRide } from "@/components/PendingRide";
import type { Ride } from "@/types/database";
import { useRideDriver } from "@/hooks/ride/useRideDriver";

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

  return (
    <PendingRide
      key={ride.id}
      ride={ride}
      onCancel={() => {}} // Não usado para motoristas
      onConclude={ride.status === 'accepted' ? handleStartRide : handleCompleteRide}
      loading={loading}
    />
  );
}
