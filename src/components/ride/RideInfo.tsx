
import { Calendar, Clock, MapPin } from "lucide-react";
import type { Ride } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RideInfoProps {
  ride: Ride;
}

export function RideInfo({ ride }: RideInfoProps) {
  return (
    <>
      <div className="flex flex-col space-y-2 p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {format(new Date(ride.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {format(new Date(ride.created_at), "HH:mm")}
          </span>
        </div>
      </div>

      <div className="flex items-start space-x-2">
        <MapPin className="w-5 h-5 mt-1 text-green-500" />
        <div>
          <p className="text-sm font-medium">Local de Partida</p>
          <p className="text-sm text-muted-foreground">{ride.pickup_address}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Latitude: {ride.pickup_latitude.toFixed(6)}, 
            Longitude: {ride.pickup_longitude.toFixed(6)}
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <MapPin className="w-5 h-5 mt-1 text-red-500" />
        <div>
          <p className="text-sm font-medium">Destino</p>
          <p className="text-sm text-muted-foreground">{ride.destination_address}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Latitude: {ride.destination_latitude.toFixed(6)}, 
            Longitude: {ride.destination_longitude.toFixed(6)}
          </p>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium">Preço Estimado</p>
        <p className="text-lg font-semibold">R$ {ride.estimated_price.toFixed(2)}</p>
      </div>
    </>
  );
}
