
import { useRef } from "react";
import type { Ride } from "@/types/database";
import { useMapInitialization } from "./map/useMapInitialization";
import { MapMarkers } from "./map/MapMarkers";
import { MapRoutes } from "./map/MapRoutes";
import { MapBounds } from "./map/MapBounds";
import { MapControls } from "./map/MapControls";
import { MapStatus } from "./map/MapStatus";
import { MapSearch } from "./map/MapSearch";
import { SelectionMap } from "./map/SelectionMap";
import { RideMapProps } from "./map/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RideMap({ 
  ride, 
  onLocationSelect, 
  selectionMode = false,
  initialLocation = null,
  driverLocation = null,
  passengerLocation = null,
  showRoute = true,
  trackingMode = false,
  showDriverToDestinationRoute = false,
  showPassengerLocation = true
}: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Use selection map component if in selection mode
  if (selectionMode && onLocationSelect) {
    return (
      <SelectionMap 
        onLocationSelect={onLocationSelect}
        initialLocation={initialLocation}
      />
    );
  }
  
  // Get center location from ride if available
  const centerLocation = ride 
    ? { lat: ride.pickup_latitude, lng: ride.pickup_longitude }
    : initialLocation || undefined;
  
  // Use map initialization hook
  const { 
    map, 
    isLoading, 
    error, 
    geocoder, 
    directionsService,
    mapInitialized,
    setMapType
  } = useMapInitialization({
    mapContainerRef: mapRef,
    center: centerLocation,
    trackingMode
  });

  return (
    <div className="relative w-full h-full">
      {/* Map type selector */}
      {mapInitialized && (
        <div className="absolute top-4 left-4 z-10">
          <Tabs defaultValue="roadmap" onValueChange={(value) => setMapType(value as google.maps.MapTypeId)}>
            <TabsList className="bg-background/80 backdrop-blur-sm">
              <TabsTrigger value="roadmap">Padrão</TabsTrigger>
              <TabsTrigger value="satellite">Satélite</TabsTrigger>
              <TabsTrigger value="hybrid">Híbrido</TabsTrigger>
              <TabsTrigger value="terrain">Terreno</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Show loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {/* Show error state */}
      {error && (
        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center p-4 text-center">
          <div className="text-destructive mb-2">Erro ao carregar o mapa</div>
          <div className="text-sm text-muted-foreground mb-4">
            {error.includes("API key") 
              ? "Chave de API do Google Maps inválida ou não configurada." 
              : error}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      )}
      
      {/* Add markers if map is initialized */}
      {mapInitialized && (
        <>
          <MapMarkers 
            map={map}
            ride={ride}
            driverLocation={driverLocation}
            passengerLocation={passengerLocation}
            showPassengerLocation={showPassengerLocation}
          />
          
          <MapRoutes 
            map={map}
            directionsService={directionsService}
            ride={ride}
            driverLocation={driverLocation}
            showRoute={showRoute}
            showDriverToDestinationRoute={showDriverToDestinationRoute}
          />
          
          <MapBounds 
            map={map}
            ride={ride}
            driverLocation={driverLocation}
            passengerLocation={passengerLocation}
            showPassengerLocation={showPassengerLocation}
            trackingMode={trackingMode}
          />
        </>
      )}
      
      {/* Location controls */}
      <MapControls map={map} geocoder={geocoder} />
      
      {/* Map status indicators */}
      <MapStatus 
        trackingMode={trackingMode}
        showPassengerLocation={showPassengerLocation}
        showDriverToDestinationRoute={showDriverToDestinationRoute}
      />
    </div>
  );
}
