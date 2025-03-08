
import { PendingRide } from "@/components/PendingRide";
import type { Ride } from "@/types/database";
import { useRideDriver } from "@/hooks/ride/useRideDriver";
import { useEffect } from "react";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { PassengerInfoProvider } from "./PassengerInfoProvider";
import { AcceptedRide } from "./AcceptedRide";
import { InProgressRide } from "./InProgressRide";
import { User } from "lucide-react"; // Add this import

interface CurrentRideProps {
  ride: Ride;
  loading: boolean;
}

export function CurrentRide({ ride, loading }: CurrentRideProps) {
  const { startRide, completeRide } = useRideDriver();
  
  const {
    startTracking,
    stopTracking,
    currentLocation,
    partnerLocation,
  } = useLocationTracking(ride.id);
  
  useEffect(() => {
    startTracking();
    
    return () => {
      stopTracking();
    };
  }, [startTracking, stopTracking]);

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
      <PassengerInfoProvider passengerId={ride.passenger_id}>
        {(passengerInfo) => (
          <AcceptedRide 
            ride={ride}
            loading={loading}
            passengerInfo={passengerInfo}
            currentLocation={currentLocation}
            partnerLocation={partnerLocation}
            onStartRide={handleStartRide}
          />
        )}
      </PassengerInfoProvider>
    );
  }

  if (ride.status === 'in_progress') {
    return (
      <PassengerInfoProvider passengerId={ride.passenger_id}>
        {(passengerInfo) => (
          <InProgressRide 
            ride={ride}
            loading={loading}
            passengerInfo={passengerInfo}
            currentLocation={currentLocation}
            partnerLocation={partnerLocation}
            onCompleteRide={handleCompleteRide}
          />
        )}
      </PassengerInfoProvider>
    );
  }

  return (
    <PendingRide
      key={ride.id}
      ride={ride}
      onCancel={() => {}} 
      onConclude={() => {
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
