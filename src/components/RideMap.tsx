
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { Ride } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { MapPin, Locate } from "lucide-react";

interface RideMapProps {
  ride?: Ride;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  selectionMode?: boolean;
}

export function RideMap({ ride, onLocationSelect, selectionMode = false }: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

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
        } : { lat: -23.55, lng: -46.63 }; // São Paulo as default

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

        // If in selection mode, allow clicking on the map to set a marker
        if (selectionMode) {
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
  }, [ride, selectionMode, onLocationSelect]);

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
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="relative w-full h-full">
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
