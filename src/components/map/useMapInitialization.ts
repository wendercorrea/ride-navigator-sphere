
import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { MapLocation } from "./types";

interface UseMapInitializationProps {
  mapContainerRef: React.RefObject<HTMLDivElement>;
  center?: MapLocation;
  zoom?: number;
  trackingMode?: boolean;
}

interface UseMapInitializationResult {
  map: google.maps.Map | null;
  isLoading: boolean;
  error: string | null;
  geocoder: google.maps.Geocoder | null;
  directionsService: google.maps.DirectionsService | null;
  mapInitialized: boolean;
}

export const useMapInitialization = ({
  mapContainerRef,
  center = { lat: -23.55, lng: -46.63 },
  zoom = 15,
  trackingMode = false
}: UseMapInitializationProps): UseMapInitializationResult => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [mapInitialized, setMapInitialized] = useState<boolean>(false);

  useEffect(() => {
    async function initMap() {
      if (!mapContainerRef.current) return;
      
      try {
        setIsLoading(true);
        setError(null);
        console.log("Starting map initialization...");
        
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
        
        const mapOptions: google.maps.MapOptions = {
          center,
          zoom: trackingMode ? 13 : zoom,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        };
        
        const newMap = new google.maps.Map(mapContainerRef.current, mapOptions);
        setMap(newMap);
        
        const newGeocoder = new google.maps.Geocoder();
        setGeocoder(newGeocoder);
        
        const newDirectionsService = new google.maps.DirectionsService();
        setDirectionsService(newDirectionsService);
        
        setMapInitialized(true);
        console.log("Map initialization completed successfully");
      } catch (error) {
        console.error("Error loading map:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(errorMessage);
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
  }, [mapContainerRef, center, zoom, trackingMode]);

  return {
    map,
    isLoading,
    error,
    geocoder,
    directionsService,
    mapInitialized
  };
};
