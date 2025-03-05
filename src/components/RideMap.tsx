
import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { Ride } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { MapPin, Locate, Search, Navigation } from "lucide-react";
import { toast } from "./ui/use-toast";

interface RideMapProps {
  ride?: Ride;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  selectionMode?: boolean;
  initialLocation?: { lat: number, lng: number } | null;
  driverLocation?: { latitude: number, longitude: number } | null;
  passengerLocation?: { latitude: number, longitude: number } | null;
  showRoute?: boolean;
  trackingMode?: boolean;
  showDriverToDestinationRoute?: boolean;
}

export function RideMap({ 
  ride, 
  onLocationSelect, 
  selectionMode = false,
  initialLocation = null,
  driverLocation = null,
  passengerLocation = null,
  showRoute = true,
  trackingMode = false,
  showDriverToDestinationRoute = false
}: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const dynamicRouteRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const passengerMarkerRef = useRef<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  // Função para atualizar a rota dinâmica entre o motorista e o destino
  const updateDynamicRoute = useCallback(() => {
    if (!ride || !driverLocation || !mapInstanceRef.current || !directionsServiceRef.current) return;
    
    const driverPosition = {
      lat: driverLocation.latitude, 
      lng: driverLocation.longitude
    };
    
    const destinationPosition = {
      lat: ride.destination_latitude,
      lng: ride.destination_longitude
    };
    
    // Cria um renderer para a rota dinâmica se ainda não existir
    if (!dynamicRouteRendererRef.current) {
      dynamicRouteRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#10b981", // Cor verde para a rota dinâmica
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });
    }
    
    // Calcula a rota entre a posição atual do motorista e o destino
    directionsServiceRef.current.route(
      {
        origin: driverPosition,
        destination: destinationPosition,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          dynamicRouteRendererRef.current!.setDirections(result);
          console.log("Dynamic route updated");
        } else {
          console.warn("Failed to get dynamic directions:", status);
        }
      }
    );
  }, [ride, driverLocation]);

  // Atualiza a rota dinâmica quando a localização do motorista muda
  useEffect(() => {
    if (showDriverToDestinationRoute && driverLocation) {
      updateDynamicRoute();
    }
  }, [driverLocation, showDriverToDestinationRoute, updateDynamicRoute]);

  useEffect(() => {
    async function initMap() {
      try {
        setIsLoading(true);
        console.log("Starting map initialization...");
        
        // Clear any previous errors
        setMapError(null);
        
        // Get the Google Maps API key from Supabase Functions
        console.log("Fetching Google Maps API key...");
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        
        if (error) {
          console.error("Error fetching Google Maps API key:", error);
          throw new Error(`Failed to get Maps API key: ${error.message}`);
        }
        
        if (!data || !data.GOOGLE_MAPS_API_KEY) {
          console.error("No Google Maps API key returned:", data);
          throw new Error("Google Maps API key not found");
        }
        
        const GOOGLE_MAPS_API_KEY = data.GOOGLE_MAPS_API_KEY;
        console.log("API key retrieved, loading Google Maps...");
        
        // Initialize the Google Maps loader
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places"],
        });

        // Load the Google Maps API
        const google = await loader.load();
        console.log("Google Maps API loaded successfully");
        
        if (!mapRef.current) {
          console.error("Map container reference not found");
          return;
        }

        // Default center (use ride pickup location if available, otherwise use a default location)
        const defaultCenter = ride ? {
          lat: ride.pickup_latitude,
          lng: ride.pickup_longitude,
        } : initialLocation || { lat: -23.55, lng: -46.63 }; // São Paulo as default

        // Create the map
        console.log("Creating map with center:", defaultCenter);
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
        
        // Initialize direction service
        directionsServiceRef.current = new google.maps.DirectionsService();
        
        // Initialize geocoder
        setGeocoder(new google.maps.Geocoder());
        console.log("Geocoder initialized");

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
            console.log("Autocomplete initialized");
          } else {
            console.warn("Search input element not found");
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
          console.log("Map click listener added");
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
          console.log("Initial marker placed at:", initialLocation);
        }

        // If we have a ride and showRoute is true, show the route
        if (ride && showRoute) {
          const pickupLocation = {
            lat: ride.pickup_latitude,
            lng: ride.pickup_longitude,
          };

          const destinationLocation = {
            lat: ride.destination_latitude,
            lng: ride.destination_longitude,
          };

          const directionsRenderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#4f46e5",
              strokeWeight: 5,
              strokeOpacity: 0.7
            }
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

          directionsServiceRef.current.route(
            {
              origin: pickupLocation,
              destination: destinationLocation,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === "OK" && result) {
                directionsRenderer.setDirections(result);
                console.log("Directions rendered successfully");
              } else {
                console.warn("Failed to get directions:", status);
              }
            }
          );
        }
        
        // If we're in tracking mode, set up driver and passenger markers
        if (trackingMode) {
          if (driverLocation) {
            // Create or update driver marker
            if (driverMarkerRef.current) {
              driverMarkerRef.current.setPosition({
                lat: driverLocation.latitude,
                lng: driverLocation.longitude
              });
            } else {
              driverMarkerRef.current = new google.maps.Marker({
                position: {
                  lat: driverLocation.latitude,
                  lng: driverLocation.longitude
                },
                map,
                title: "Motorista",
                icon: {
                  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                },
              });
            }
          }
          
          if (passengerLocation) {
            // Create or update passenger marker
            if (passengerMarkerRef.current) {
              passengerMarkerRef.current.setPosition({
                lat: passengerLocation.latitude,
                lng: passengerLocation.longitude
              });
            } else {
              passengerMarkerRef.current = new google.maps.Marker({
                position: {
                  lat: passengerLocation.latitude,
                  lng: passengerLocation.longitude
                },
                map,
                title: "Passageiro",
                icon: {
                  url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                },
              });
            }
          }
          
          // Se precisamos mostrar a rota entre o motorista e o destino
          if (showDriverToDestinationRoute && driverLocation) {
            updateDynamicRoute();
          }
        }
        
        console.log("Map initialization completed successfully");
      } catch (error) {
        console.error("Error loading map:", error);
        setMapError(error instanceof Error ? error.message : String(error));
        toast({
          title: "Erro no Mapa",
          description: "Falha ao carregar o Google Maps. Verifique a conexão e tente novamente.",
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
      if (dynamicRouteRendererRef.current) {
        dynamicRouteRendererRef.current.setMap(null);
      }
      if (currentMarker) {
        currentMarker.setMap(null);
      }
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null);
      }
      if (passengerMarkerRef.current) {
        passengerMarkerRef.current.setMap(null);
      }
    };
  }, [ride, selectionMode, onLocationSelect, initialLocation, showRoute, updateDynamicRoute]);

  // Update driver and passenger markers when their locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !trackingMode) return;
    
    if (driverLocation && driverLocation.latitude && driverLocation.longitude) {
      const position = {
        lat: driverLocation.latitude,
        lng: driverLocation.longitude
      };
      
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setPosition(position);
      } else {
        driverMarkerRef.current = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: "Motorista",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          },
        });
      }
      
      // Center map on driver if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(position);
      }
    }
    
    if (passengerLocation && passengerLocation.latitude && passengerLocation.longitude) {
      const position = {
        lat: passengerLocation.latitude,
        lng: passengerLocation.longitude
      };
      
      if (passengerMarkerRef.current) {
        passengerMarkerRef.current.setPosition(position);
      } else {
        passengerMarkerRef.current = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: "Passageiro",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
          },
        });
      }
    }
  }, [driverLocation, passengerLocation, trackingMode]);

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
            title: "Erro de Localização",
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
      {mapError && (
        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center p-4 text-center">
          <div className="text-destructive mb-2">Erro ao carregar o mapa</div>
          <div className="text-sm text-muted-foreground mb-4">
            {mapError.includes("API key") 
              ? "Chave de API do Google Maps inválida ou não configurada." 
              : mapError}
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
      <Button 
        size="sm"
        variant="secondary"
        className="absolute bottom-4 right-4 shadow-lg"
        onClick={getCurrentLocation}
      >
        <Locate className="mr-2 h-4 w-4" />
        Usar minha localização
      </Button>
      {trackingMode && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
            Motorista
          </div>
          <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
            Passageiro
          </div>
          {showDriverToDestinationRoute && (
            <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Rota Ativa
            </div>
          )}
        </div>
      )}
    </div>
  );
}
