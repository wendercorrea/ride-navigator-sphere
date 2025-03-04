
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { Ride } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { MapPin, Locate, Search } from "lucide-react";
import { toast } from "./ui/use-toast";

interface RideMapProps {
  ride?: Ride;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  selectionMode?: boolean;
  initialLocation?: { lat: number, lng: number } | null;
}

export function RideMap({ 
  ride, 
  onLocationSelect, 
  selectionMode = false,
  initialLocation = null
}: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    async function initMap() {
      try {
        setIsLoading(true);
        const { data: { GOOGLE_MAPS_API_KEY }, error } = await supabase
          .functions.invoke('get-maps-key');
          
        if (error) throw error;

        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places"],
        });

        const google = await loader.load();
        
        if (!mapRef.current) return;

        // Default center (use ride pickup location if available, otherwise use a default location)
        const defaultCenter = ride ? {
          lat: ride.pickup_latitude,
          lng: ride.pickup_longitude,
        } : initialLocation || { lat: -23.55, lng: -46.63 }; // São Paulo as default

        const map = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 15,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstanceRef.current = map;
        
        // Initialize geocoder
        setGeocoder(new google.maps.Geocoder());

        // Create searchbox for location search
        if (selectionMode) {
          // Initialize autocomplete
          const input = document.getElementById("map-search-input") as HTMLInputElement;
          if (input) {
            const autocomplete = new google.maps.places.Autocomplete(input);
            autocomplete.bindTo("bounds", map);
            
            autocomplete.addListener("place_changed", () => {
              const place = autocomplete.getPlace();
              if (!place.geometry || !place.geometry.location) return;
              
              map.setCenter(place.geometry.location);
              map.setZoom(17);
              
              if (currentMarker) {
                currentMarker.setMap(null);
              }
              
              const marker = new google.maps.Marker({
                position: place.geometry.location,
                map,
                title: place.name,
                animation: google.maps.Animation.DROP,
              });
              
              setCurrentMarker(marker);
              
              if (onLocationSelect) {
                onLocationSelect(
                  place.geometry.location.lat(),
                  place.geometry.location.lng(),
                  place.formatted_address || place.name || ""
                );
              }
            });
          }
          
          // If in selection mode, allow clicking on the map to set a marker
          map.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (currentMarker) {
              currentMarker.setMap(null);
            }
            
            const position = e.latLng!;
            const marker = new google.maps.Marker({
              position,
              map,
              title: "Local selecionado",
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
              },
              animation: google.maps.Animation.DROP,
            });
            
            setCurrentMarker(marker);
            
            // Get address from coordinates
            if (geocoder) {
              geocoder.geocode({ location: position }, (results, status) => {
                if (status === "OK" && results && results[0]) {
                  const address = results[0].formatted_address;
                  
                  if (onLocationSelect) {
                    onLocationSelect(
                      position.lat(), 
                      position.lng(), 
                      address
                    );
                  }
                }
              });
            }
          });
        }

        // If initialLocation exists and we're in selection mode, place a marker
        if (initialLocation && selectionMode) {
          const marker = new google.maps.Marker({
            position: initialLocation,
            map,
            title: "Local selecionado",
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            },
            animation: google.maps.Animation.DROP,
          });
          
          setCurrentMarker(marker);
        }

        // If we have a ride, show the route
        if (ride) {
          const pickupLocation = {
            lat: ride.pickup_latitude,
            lng: ride.pickup_longitude,
          };

          const destinationLocation = {
            lat: ride.destination_latitude,
            lng: ride.destination_longitude,
          };

          const directionsService = new google.maps.DirectionsService();
          const directionsRenderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
          });

          directionsRendererRef.current = directionsRenderer;

          const pickupMarker = new google.maps.Marker({
            position: pickupLocation,
            map,
            title: "Ponto de partida",
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            },
          });

          const destinationMarker = new google.maps.Marker({
            position: destinationLocation,
            map,
            title: "Destino",
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            },
          });

          directionsService.route(
            {
              origin: pickupLocation,
              destination: destinationLocation,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === "OK" && result) {
                directionsRenderer.setDirections(result);
              }
            }
          );
        }
      } catch (error) {
        console.error("Error loading map:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar o mapa. Por favor, tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    initMap();

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      if (currentMarker) {
        currentMarker.setMap(null);
      }
    };
  }, [ride, selectionMode, onLocationSelect, initialLocation]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(location);
            mapInstanceRef.current.setZoom(17);
            
            // Remove previous marker if exists
            if (currentMarker) {
              currentMarker.setMap(null);
            }
            
            // Create new marker at current location
            const marker = new google.maps.Marker({
              position: location,
              map: mapInstanceRef.current,
              title: "Sua localização",
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              },
              animation: google.maps.Animation.DROP,
            });
            
            setCurrentMarker(marker);
            
            // Get address from coordinates if in selection mode
            if (selectionMode && geocoder) {
              geocoder.geocode({ location }, (results, status) => {
                if (status === "OK" && results && results[0]) {
                  const address = results[0].formatted_address;
                  
                  if (onLocationSelect) {
                    onLocationSelect(
                      location.lat, 
                      location.lng, 
                      address
                    );
                  }
                }
              });
            }
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Erro",
            description: "Falha ao obter sua localização. Verifique se o acesso à localização está permitido.",
            variant: "destructive",
          });
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      toast({
        title: "Erro",
        description: "Geolocalização não é suportada por este navegador.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      {selectionMode && (
        <div className="absolute top-4 left-4 right-16 z-10">
          <div className="relative">
            <input
              id="map-search-input"
              type="text"
              placeholder="Buscar local..."
              className="w-full px-4 py-2 pr-10 rounded-md border border-gray-300 shadow-sm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
      <Button 
        size="sm"
        variant="secondary"
        className="absolute bottom-4 right-4 shadow-lg"
        onClick={getCurrentLocation}
      >
        <Locate className="mr-2 h-4 w-4" />
        Usar minha localização
      </Button>
    </div>
  );
}
