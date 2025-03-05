
import { useRideManagement } from "@/hooks/useRideManagement";
import { PassengerHome } from "@/components/passenger/PassengerHome";
import { DriverHome } from "@/components/driver/DriverHome";
import { useEffect } from "react";

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
    updatePickupWithCoords,
    updateDestinationWithCoords,
  } = useRideManagement();

  useEffect(() => {
    // Verifica se as APIs necessárias estão habilitadas no projeto do Google Maps
    const checkApiValidity = async () => {
      try {
        const directionsService = new google.maps.DirectionsService();
        const testRequest = {
          origin: { lat: -23.55, lng: -46.63 }, // São Paulo
          destination: { lat: -23.56, lng: -46.64 }, // Próximo a São Paulo
          travelMode: google.maps.TravelMode.DRIVING,
        };
        
        directionsService.route(testRequest, (result, status) => {
          if (status !== "OK") {
            console.warn(`Directions API test failed: ${status}. Por favor, certifique-se de que a API de Direções está habilitada no Google Cloud Console.`);
            toast({
              title: "Alerta do Google Maps",
              description: "A API de Direções do Google Maps não está configurada corretamente. Algumas funcionalidades de rota podem não funcionar.",
              variant: "warning",
            });
          } else {
            console.log("Directions API is properly configured and working.");
          }
        });
      } catch (error) {
        console.error("Error testing Google Maps APIs:", error);
      }
    };
    
    // Executa o teste quando a API do Google Maps estiver carregada
    if (window.google && window.google.maps) {
      checkApiValidity();
    } else {
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          checkApiValidity();
          clearInterval(checkGoogleMaps);
        }
      }, 1000);
      
      // Limpa o intervalo após 10 segundos para evitar vazamentos de memória
      setTimeout(() => clearInterval(checkGoogleMaps), 10000);
    }
  }, []);

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
            updatePickupWithCoords={updatePickupWithCoords}
            updateDestinationWithCoords={updateDestinationWithCoords}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
