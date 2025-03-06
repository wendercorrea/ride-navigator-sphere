
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { createSearchLocationIcon } from "./mapUtils";

interface MapControlsProps {
  map: google.maps.Map | null;
  geocoder: google.maps.Geocoder | null;
  onLocationSelected?: (lat: number, lng: number, address: string) => void;
  selectionMode?: boolean;
}

export const MapControls = ({
  map,
  geocoder,
  onLocationSelected,
  selectionMode = false
}: MapControlsProps) => {
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Erro",
        description: "Geolocalização não é suportada por este navegador.",
        variant: "destructive",
      });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        if (map) {
          map.setCenter(location);
          map.setZoom(17);
          
          if (selectionMode) {
            // Add a marker for the selected location
            new google.maps.Marker({
              position: location,
              map,
              title: "Sua localização",
              icon: createSearchLocationIcon(),
              animation: google.maps.Animation.DROP,
            });
            
            if (geocoder && onLocationSelected) {
              geocoder.geocode({ location }, (results, status) => {
                if (status === "OK" && results && results[0]) {
                  const address = results[0].formatted_address;
                  onLocationSelected(location.lat, location.lng, address);
                }
              });
            }
          }
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Erro de Localização",
          description: "Falha ao obter sua localização. Verifique se o acesso à localização está permitido.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <Button 
      size="sm"
      variant="secondary"
      className="absolute bottom-4 right-4 shadow-lg"
      onClick={getCurrentLocation}
    >
      <Locate className="mr-2 h-4 w-4" />
      Usar minha localização
    </Button>
  );
};
