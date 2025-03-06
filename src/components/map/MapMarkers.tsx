
import { useEffect, useRef } from "react";
import { Ride } from "@/types/database";
import { Location, MapLocation } from "./types";
import { 
  locationToMapLocation, 
  createCarIcon, 
  createPassengerIcon, 
  createPickupIcon, 
  createDestinationIcon 
} from "./mapUtils";

interface MapMarkersProps {
  map: google.maps.Map | null;
  ride?: Ride;
  driverLocation?: Location | null;
  passengerLocation?: Location | null;
  showPassengerLocation?: boolean;
}

export const MapMarkers = ({
  map,
  ride,
  driverLocation,
  passengerLocation,
  showPassengerLocation = true
}: MapMarkersProps) => {
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const passengerMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);

  // Create or update driver marker
  useEffect(() => {
    if (!map || !driverLocation) return;
    
    const position = locationToMapLocation(driverLocation);
    
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(position);
    } else {
      driverMarkerRef.current = new google.maps.Marker({
        position,
        map,
        title: "Motorista",
        icon: createCarIcon()
      });
    }
    
    return () => {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null);
        driverMarkerRef.current = null;
      }
    };
  }, [map, driverLocation]);

  // Create or update passenger marker
  useEffect(() => {
    if (!map || !passengerLocation) return;
    
    const position = locationToMapLocation(passengerLocation);
    
    if (passengerMarkerRef.current) {
      passengerMarkerRef.current.setPosition(position);
      passengerMarkerRef.current.setVisible(showPassengerLocation);
    } else if (showPassengerLocation) {
      passengerMarkerRef.current = new google.maps.Marker({
        position,
        map,
        title: "Passageiro",
        icon: createPassengerIcon(),
      });
    }
    
    return () => {
      if (passengerMarkerRef.current) {
        passengerMarkerRef.current.setMap(null);
        passengerMarkerRef.current = null;
      }
    };
  }, [map, passengerLocation, showPassengerLocation]);

  // Create pickup and destination markers for the ride
  useEffect(() => {
    if (!map || !ride) return;
    
    const pickupLocation = {
      lat: ride.pickup_latitude,
      lng: ride.pickup_longitude,
    };

    const destinationLocation = {
      lat: ride.destination_latitude,
      lng: ride.destination_longitude,
    };
    
    if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = new google.maps.Marker({
        position: pickupLocation,
        map,
        title: "Ponto de partida",
        icon: createPickupIcon(),
      });
    }
    
    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = new google.maps.Marker({
        position: destinationLocation,
        map,
        title: "Destino",
        icon: createDestinationIcon(),
      });
    }
    
    return () => {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setMap(null);
        pickupMarkerRef.current = null;
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = null;
      }
    };
  }, [map, ride]);

  return null; // This is a non-visual component
};
