
import { useRideManagement } from "@/hooks/useRideManagement";
import { PassengerHome } from "@/components/passenger/PassengerHome";
import { DriverHome } from "@/components/driver/DriverHome";

const Index = () => {
  const {
    pickup,
    setPickup,
    destination,
    setDestination,
    loading,
    pendingRide,
    availableRides,
    isDriver,
    handleRequestRide,
    handleCancelRide,
    showCancelDialog,
    setShowCancelDialog,
  } = useRideManagement();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-secondary to-background">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none" />

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-20 min-h-screen flex flex-col items-center space-y-12">
        {isDriver ? (
          <DriverHome 
            availableRides={availableRides}
            loading={loading}
          />
        ) : (
          <PassengerHome
            pickup={pickup}
            destination={destination}
            loading={loading}
            pendingRide={pendingRide}
            showCancelDialog={showCancelDialog}
            onPickupChange={setPickup}
            onDestinationChange={setDestination}
            onRequestRide={handleRequestRide}
            onCancelRide={handleCancelRide}
            setShowCancelDialog={setShowCancelDialog}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
