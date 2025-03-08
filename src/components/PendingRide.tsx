
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RideMap } from "@/components/RideMap";
import type { Ride } from "@/types/database";
import { useRideDriver } from "@/hooks/ride/useRideDriver";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { RideInfo } from "@/components/ride/RideInfo";
import { DriverInfo } from "@/components/ride/DriverInfo";
import { RideStatusCard } from "@/components/ride/RideStatusCard";
import { ActionButtons } from "@/components/ride/ActionButtons";

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

export function PendingRide({ ride, onCancel, onConclude, loading = false }: PendingRideProps) {
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
            <RideInfo ride={ride} />

            {ride.status === 'accepted' && driverInfo && (
              <DriverInfo
                firstName={driverInfo.first_name}
                lastName={driverInfo.last_name}
                vehicleModel={driverInfo.vehicle_model}
                vehicleColor={driverInfo.vehicle_color}
                licensePlate={driverInfo.license_plate}
              />
            )}

            {ride.status === 'accepted' && partnerLocation && !isDriver && (
              <RideStatusCard type="driver-approaching" />
            )}
            
            {ride.status === 'in_progress' && !isDriver && (
              <RideStatusCard type="in-progress" />
            )}

            <div className="space-y-2">
              <ActionButtons
                ride={ride}
                isDriver={isDriver}
                loading={loading}
                onCancel={onCancel}
                onConclude={onConclude}
                onAccept={handleAcceptRide}
                isAccepting={isAccepting}
              />
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
