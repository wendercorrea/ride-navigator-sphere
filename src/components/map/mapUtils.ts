
import { MapLocation, Location } from "./types";

export const locationToMapLocation = (location: Location): MapLocation => ({
  lat: location.latitude,
  lng: location.longitude
});

export const createCarIcon = (size: number = 32): google.maps.Icon => ({
  url: "https://maps.google.com/mapfiles/ms/icons/cabs.png",
  scaledSize: new google.maps.Size(size, size),
  origin: new google.maps.Point(0, 0),
  anchor: new google.maps.Point(size/2, size/2)
});

export const createPassengerIcon = (): google.maps.Icon => ({
  url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
});

export const createPickupIcon = (): google.maps.Icon => ({
  url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
});

export const createDestinationIcon = (): google.maps.Icon => ({
  url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
});

export const createSearchLocationIcon = (): google.maps.Icon => ({
  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
});

export const createPolyline = (
  from: MapLocation, 
  to: MapLocation, 
  color: string = "#4f46e5", 
  weight: number = 5, 
  opacity: number = 0.7
): google.maps.Polyline => {
  return new google.maps.Polyline({
    path: [from, to],
    geodesic: true,
    strokeColor: color,
    strokeWeight: weight,
    strokeOpacity: opacity,
  });
};

export const fitBounds = (
  map: google.maps.Map,
  locations: MapLocation[],
  padding: number = 50
): void => {
  if (!locations.length) return;
  
  const bounds = new google.maps.LatLngBounds();
  locations.forEach(location => bounds.extend(location));
  
  const paddingValue = {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
  
  map.fitBounds(bounds, paddingValue);
};

export const handleDirectionsError = (
  map: google.maps.Map,
  origin: MapLocation,
  destination: MapLocation,
  color: string = "#4f46e5"
): any => {
  // Create a simple polyline as fallback
  const path = createPolyline(origin, destination, color);
  path.setMap(map);
  
  // Return an object that mimics a DirectionsRenderer for consistent interface
  return {
    setMap: (map: google.maps.Map | null) => {
      path.setMap(map);
    }
  } as any;
};
