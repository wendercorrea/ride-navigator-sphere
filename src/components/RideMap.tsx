
import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { Ride } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";

interface RideMapProps {
  ride: Ride;
}

export function RideMap({ ride }: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    async function initMap() {
      try {
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

        const pickupLocation = {
          lat: ride.pickup_latitude,
          lng: ride.pickup_longitude,
        };

        const destinationLocation = {
          lat: ride.destination_latitude,
          lng: ride.destination_longitude,
        };

        const map = new google.maps.Map(mapRef.current, {
          center: pickupLocation,
          zoom: 12,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstanceRef.current = map;

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
      } catch (error) {
        console.error("Error loading map:", error);
      }
    }

    initMap();

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [ride]);

  return <div ref={mapRef} className="w-full h-full" />;
}
