
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

interface MapSearchProps {
  map: google.maps.Map | null;
  selectionMode: boolean;
  onPlaceSelected?: (lat: number, lng: number, address: string) => void;
}

export const MapSearch = ({
  map,
  selectionMode,
  onPlaceSelected
}: MapSearchProps) => {
  const [searchValue, setSearchValue] = useState("");
  
  useEffect(() => {
    if (!map || !selectionMode) return;
    
    const input = document.getElementById("map-search-input") as HTMLInputElement;
    if (!input) return;
    
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo("bounds", map);
    
    const autocompleteListener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) return;
      
      map.setCenter(place.geometry.location);
      map.setZoom(17);
      
      if (onPlaceSelected) {
        onPlaceSelected(
          place.geometry.location.lat(),
          place.geometry.location.lng(),
          place.formatted_address || place.name || ""
        );
      }
    });
    
    return () => {
      google.maps.event.removeListener(autocompleteListener);
    };
  }, [map, selectionMode, onPlaceSelected]);
  
  if (!selectionMode) return null;
  
  return (
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
  );
};
