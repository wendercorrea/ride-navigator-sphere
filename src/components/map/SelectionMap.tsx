
import { useEffect, useRef, useState } from "react";
import { MapLocation } from "./types";
import { useMapInitialization } from "./useMapInitialization";
import { MapSearch } from "./MapSearch";
import { MapControls } from "./MapControls";
import { createSearchLocationIcon } from "./mapUtils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SelectionMapProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLocation?: MapLocation | null;
}

export const SelectionMap = ({
  onLocationSelect,
  initialLocation = null
}: SelectionMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);
  
  const { 
    map, 
    isLoading, 
    error, 
    geocoder,
    mapInitialized,
    setMapType
  } = useMapInitialization({
    mapContainerRef: mapRef,
    center: initialLocation || undefined
  });
  
  // Set up map click listener for location selection
  useEffect(() => {
    if (!map || !geocoder || !mapInitialized) return;
    
    const clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (currentMarker) {
        currentMarker.setMap(null);
      }
      
      const position = e.latLng!;
      const marker = new google.maps.Marker({
        position,
        map,
        title: "Local selecionado",
        icon: createSearchLocationIcon(),
        animation: google.maps.Animation.DROP,
      });
      
      setCurrentMarker(marker);
      
      geocoder.geocode({ location: position }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const address = results[0].formatted_address;
          onLocationSelect(position.lat(), position.lng(), address);
        }
      });
    });
    
    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, geocoder, mapInitialized, currentMarker, onLocationSelect]);
  
  // Place initial marker if provided
  useEffect(() => {
    if (!map || !initialLocation || !mapInitialized) return;
    
    if (currentMarker) {
      currentMarker.setMap(null);
    }
    
    const marker = new google.maps.Marker({
      position: initialLocation,
      map,
      title: "Local selecionado",
      icon: createSearchLocationIcon(),
      animation: google.maps.Animation.DROP,
    });
    
    setCurrentMarker(marker);
    
    return () => {
      if (marker) marker.setMap(null);
    };
  }, [map, initialLocation, mapInitialized]);
  
  return (
    <div className="relative w-full h-full">
      {/* Map type selector */}
      {mapInitialized && (
        <div className="absolute top-4 left-4 z-20">
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
      
      <MapSearch 
        map={map} 
        selectionMode={true} 
        onPlaceSelected={(lat, lng, address) => {
          if (currentMarker) {
            currentMarker.setMap(null);
          }
          
          if (map) {
            const position = { lat, lng };
            const marker = new google.maps.Marker({
              position,
              map,
              title: "Local selecionado",
              icon: createSearchLocationIcon(),
              animation: google.maps.Animation.DROP,
            });
            
            setCurrentMarker(marker);
            onLocationSelect(lat, lng, address);
          }
        }}
      />
      
      <div ref={mapRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
      
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
      
      <MapControls 
        map={map} 
        geocoder={geocoder} 
        onLocationSelected={onLocationSelect}
        selectionMode={true}
      />
    </div>
  );
};
