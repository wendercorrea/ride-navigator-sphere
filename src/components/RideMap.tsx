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
  showPassengerLocation?: boolean;
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
  showDriverToDestinationRoute = false,
  showPassengerLocation = true
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
  const [routeDisplayed, setRouteDisplayed] = useState(false);

  const updateDynamicRoute = useCallback(() => {
    if (!ride || !driverLocation || !mapInstanceRef.current || !directionsServiceRef.current) {
      console.log("Missing requirements for dynamic route update");
      return;
    }
    
    const driverPosition = {
      lat: driverLocation.latitude, 
      lng: driverLocation.longitude
    };
    
    const destinationPosition = {
      lat: ride.destination_latitude,
      lng: ride.destination_longitude
    };
    
    console.log("Updating dynamic route from driver to destination:", driverPosition, destinationPosition);
    
    if (!dynamicRouteRendererRef.current) {
      dynamicRouteRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#10b981",
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });
    }
    
    directionsServiceRef.current.route(
      {
        origin: driverPosition,
        destination: destinationPosition,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          dynamicRouteRendererRef.current!.setDirections(result);
          console.log("Dynamic route updated successfully");
        } else {
          console.warn("Failed to get dynamic directions:", status);
          
          directionsServiceRef.current!.route(
            {
              origin: driverPosition,
              destination: destinationPosition,
              travelMode: google.maps.TravelMode.DRIVING,
              avoidHighways: true,
            },
            (fallbackResult, fallbackStatus) => {
              if (fallbackStatus === "OK" && fallbackResult) {
                dynamicRouteRendererRef.current!.setDirections(fallbackResult);
                console.log("Dynamic route updated with fallback options");
              } else {
                console.warn("All fallback attempts failed, using direct polyline");
                
                if (mapInstanceRef.current) {
                  if (dynamicRouteRendererRef.current) {
                    dynamicRouteRendererRef.current.setMap(null);
                    dynamicRouteRendererRef.current = null;
                  }
                  
                  const path = new google.maps.Polyline({
                    path: [driverPosition, destinationPosition],
                    geodesic: true,
                    strokeColor: "#10b981",
                    strokeWeight: 5,
                    strokeOpacity: 0.7,
                  });
                  
                  dynamicRouteRendererRef.current = {
                    setMap: (map) => {
                      path.setMap(map);
                    }
                  } as any;
                  
                  path.setMap(mapInstanceRef.current);
                }
              }
            }
          );
        }
      }
    );
  }, [ride, driverLocation]);

  useEffect(() => {
    if (showDriverToDestinationRoute && driverLocation) {
      updateDynamicRoute();
    }
  }, [driverLocation, showDriverToDestinationRoute, updateDynamicRoute]);

  const createStaticRoute = useCallback(() => {
    if (!ride || !mapInstanceRef.current || !directionsServiceRef.current || routeDisplayed) return;
    
    const pickupLocation = {
      lat: ride.pickup_latitude,
      lng: ride.pickup_longitude,
    };

    const destinationLocation = {
      lat: ride.destination_latitude,
      lng: ride.destination_longitude,
    };
    
    console.log("Creating static route from pickup to destination:", pickupLocation, destinationLocation);

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#4f46e5",
        strokeWeight: 5,
        strokeOpacity: 0.7
      }
    });

    directionsRendererRef.current = directionsRenderer;

    new google.maps.Marker({
      position: pickupLocation,
      map: mapInstanceRef.current,
      title: "Ponto de partida",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      },
    });

    new google.maps.Marker({
      position: destinationLocation,
      map: mapInstanceRef.current,
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
          setRouteDisplayed(true);
          
          if (mapInstanceRef.current && result.routes[0]?.bounds) {
            mapInstanceRef.current.fitBounds(result.routes[0].bounds);
          }
        } else {
          console.warn("Failed to get directions:", status);
          
          directionsServiceRef.current!.route(
            {
              origin: pickupLocation,
              destination: destinationLocation,
              travelMode: google.maps.TravelMode.DRIVING,
              avoidHighways: true,
            },
            (fallbackResult, fallbackStatus) => {
              if (fallbackStatus === "OK" && fallbackResult) {
                directionsRenderer.setDirections(fallbackResult);
                console.log("Directions rendered with fallback options");
                setRouteDisplayed(true);
                
                if (mapInstanceRef.current && fallbackResult.routes[0]?.bounds) {
                  mapInstanceRef.current.fitBounds(fallbackResult.routes[0].bounds);
                }
              } else {
                console.warn("All fallback attempts failed, using direct polyline");
                
                const path = new google.maps.Polyline({
                  path: [pickupLocation, destinationLocation],
                  geodesic: true,
                  strokeColor: "#4f46e5",
                  strokeOpacity: 0.7,
                  strokeWeight: 5,
                });
                
                path.setMap(mapInstanceRef.current);
                console.log("Created direct polyline as fallback");
                setRouteDisplayed(true);
                
                if (mapInstanceRef.current) {
                  const bounds = new google.maps.LatLngBounds()
                    .extend(pickupLocation)
                    .extend(destinationLocation);
                  mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
                }
              }
            }
          );
        }
      }
    );
  }, [ride, routeDisplayed]);

  useEffect(() => {
    async function initMap() {
      try {
        setIsLoading(true);
        console.log("Starting map initialization...");
        
        setMapError(null);
        
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
        
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places"],
        });

        const google = await loader.load();
        console.log("Google Maps API loaded successfully");
        
        if (!mapRef.current) {
          console.error("Map container reference not found");
          return;
        }

        const defaultCenter = ride ? {
          lat: ride.pickup_latitude,
          lng: ride.pickup_longitude,
        } : initialLocation || { lat: -23.55, lng: -46.63 };

        console.log("Creating map with center:", defaultCenter);
        const map = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: trackingMode ? 13 : 15,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstanceRef.current = map;
        
        directionsServiceRef.current = new google.maps.DirectionsService();
        
        setGeocoder(new google.maps.Geocoder());
        console.log("Geocoder initialized");

        if (selectionMode) {
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

        if (ride && showRoute) {
          createStaticRoute();
        }
        
        if (trackingMode) {
          if (driverLocation) {
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
            
            if (ride && showDriverToDestinationRoute) {
              const bounds = new google.maps.LatLngBounds()
                .extend({lat: driverLocation.latitude, lng: driverLocation.longitude})
                .extend({lat: ride.destination_latitude, lng: ride.destination_longitude});
              
              if (passengerLocation && showPassengerLocation) {
                bounds.extend({lat: passengerLocation.latitude, lng: passengerLocation.longitude});
              }
              
              map.fitBounds(bounds, { padding: 60 });
            }
          }
          
          if (passengerLocation && showPassengerLocation) {
            if (passengerMarkerRef.current) {
              passengerMarkerRef.current.setPosition({
                lat: passengerLocation.latitude,
                lng: passengerLocation.longitude
              });
              passengerMarkerRef.current.setVisible(true);
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
          } else if (passengerMarkerRef.current) {
            passengerMarkerRef.current.setVisible(false);
          }
          
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
  }, [ride, selectionMode, onLocationSelect, initialLocation, showRoute, updateDynamicRoute, createStaticRoute, trackingMode, showPassengerLocation, driverLocation, passengerLocation]);

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
      
      if (mapInstanceRef.current && ride && showDriverToDestinationRoute) {
        const bounds = new google.maps.LatLngBounds()
          .extend(position)
          .extend({lat: ride.destination_latitude, lng: ride.destination_longitude});
        
        mapInstanceRef.current.fitBounds(bounds, { padding: 60 });
      } else if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(position);
      }
    }
    
    if (passengerLocation && passengerLocation.latitude && passengerLocation.longitude && showPassengerLocation) {
      const position = {
        lat: passengerLocation.latitude,
        lng: passengerLocation.longitude
      };
      
      if (passengerMarkerRef.current) {
        passengerMarkerRef.current.setPosition(position);
        passengerMarkerRef.current.setVisible(true);
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
    } else if (passengerMarkerRef.current) {
      passengerMarkerRef.current.setVisible(false);
    }
  }, [driverLocation, passengerLocation, trackingMode, showPassengerLocation, ride, showDriverToDestinationRoute]);

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
            
            if (currentMarker) {
              currentMarker.setMap(null);
            }
            
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
          {showPassengerLocation && (
            <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
              Passageiro
            </div>
          )}
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
