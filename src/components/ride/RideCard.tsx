
import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock, Car, User, DollarSign, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RideMap } from "@/components/RideMap";
import { StatusBadge } from "@/components/ride/StatusBadge";
import type { Ride } from "@/types/database";
import { Database } from "@/integrations/supabase/types";

type RideStatus = Database["public"]["Enums"]["ride_status"];

interface ExtendedRide extends Ride {
  passenger: {
    first_name: string;
    last_name: string;
  };
  driver: {
    first_name: string;
    last_name: string;
  } | null;
}

interface RideCardProps {
  ride: ExtendedRide;
  userId: string;
}

export const RideCard = ({ ride, userId }: RideCardProps) => {
  const formatRideDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Hoje às ${format(date, "HH:mm")}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem às ${format(date, "HH:mm")}`;
    } else {
      return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    }
  };

  return (
    <Card key={ride.id} className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <StatusBadge status={ride.status} />
                <span className="text-sm text-muted-foreground">
                  {formatRideDate(ride.created_at)}
                </span>
              </div>
              <h3 className="text-lg font-medium mt-2">
                {ride.pickup_address.split(',')[0]} → {ride.destination_address.split(',')[0]}
              </h3>
            </div>
            <div className="text-right flex items-center">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="font-semibold">
                R$ {ride.final_price ? ride.final_price.toFixed(2) : ride.estimated_price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          <div className="p-4 col-span-2 space-y-4 border-r lg:border-r-0">
            {/* Endereços */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 mt-1 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Origem</p>
                  <p className="text-sm text-muted-foreground">{ride.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 mt-1 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Destino</p>
                  <p className="text-sm text-muted-foreground">{ride.destination_address}</p>
                </div>
              </div>
            </div>

            {/* Informações do Passageiro/Motorista */}
            <div className="pt-2 border-t">
              {userId === ride.passenger_id ? (
                ride.driver && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Car className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Motorista:</span>
                    <span>
                      {ride.driver.first_name} {ride.driver.last_name}
                    </span>
                  </div>
                )
              ) : (
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Passageiro:</span>
                  <span>
                    {ride.passenger.first_name} {ride.passenger.last_name}
                  </span>
                </div>
              )}
            </div>

            {/* Datas importantes */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              {ride.started_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Iniciada: {format(new Date(ride.started_at), "dd/MM/yyyy HH:mm")}</span>
                </div>
              )}
              {ride.completed_at && (
                <div className="flex items-center gap-1">
                  <BadgeCheck className="h-3 w-3 text-green-500" />
                  <span>Concluída: {format(new Date(ride.completed_at), "dd/MM/yyyy HH:mm")}</span>
                </div>
              )}
              {ride.cancelled_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-red-500" />
                  <span>Cancelada: {format(new Date(ride.cancelled_at), "dd/MM/yyyy HH:mm")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mapa */}
          <div className="h-[200px] lg:h-auto col-span-3">
            <RideMap ride={ride} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
