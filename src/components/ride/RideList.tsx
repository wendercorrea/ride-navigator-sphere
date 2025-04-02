
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RideCard } from "@/components/ride/RideCard";
import type { Ride } from "@/types/database";
import { Database } from "@/integrations/supabase/types";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";

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

interface RideListProps {
  rides: ExtendedRide[];
  userId: string;
  filter: RideStatus | null;
}

export const RideList = ({ rides, userId, filter }: RideListProps) => {
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      accepted: "Aceita",
      in_progress: "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada"
    };
    return statusMap[status] || status;
  };

  if (rides.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {filter 
            ? `Nenhuma corrida com status "${getStatusText(filter)}" encontrada.` 
            : "Nenhuma corrida encontrada no histórico."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {rides.map((ride) => (
        <RideCard key={ride.id} ride={ride} userId={userId} />
      ))}
    </div>
  );
};
