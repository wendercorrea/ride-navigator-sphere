
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RideMap } from "@/components/RideMap";
import type { Ride } from "@/types/database";
import { format } from "date-fns";

interface RideWithProfiles extends Ride {
  passenger: {
    first_name: string;
    last_name: string;
  };
  driver: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function RideHistory() {
  const { user, profile } = useAuth();
  const [selectedRide, setSelectedRide] = useState<RideWithProfiles | null>(null);
  const isDriver = profile?.id && Boolean(user);

  const { data: rides, isLoading } = useQuery({
    queryKey: ["rides", user?.id, isDriver],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const query = supabase
        .from("rides")
        .select(`
          *,
          passenger:profiles!rides_passenger_id_fkey(first_name, last_name),
          driver:profiles!rides_driver_id_fkey(first_name, last_name)
        `);

      if (isDriver) {
        query.eq("driver_id", user.id);
      } else {
        query.eq("passenger_id", user.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as RideWithProfiles[];
    },
    enabled: Boolean(user?.id),
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isDriver ? "Histórico de Corridas (Motorista)" : "Histórico de Viagens"}
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {rides?.map((ride) => (
            <Card 
              key={ride.id} 
              className={`cursor-pointer transition-colors ${
                selectedRide?.id === ride.id ? "border-primary" : ""
              }`}
              onClick={() => setSelectedRide(ride)}
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(new Date(ride.created_at), "dd/MM/yyyy HH:mm")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>De:</strong> {ride.pickup_address}</p>
                  <p><strong>Para:</strong> {ride.destination_address}</p>
                  <p><strong>Status:</strong> {ride.status}</p>
                  <p>
                    <strong>Preço:</strong>{" "}
                    R$ {(ride.final_price || ride.estimated_price).toFixed(2)}
                  </p>
                  {isDriver ? (
                    <p>
                      <strong>Passageiro:</strong>{" "}
                      {ride.passenger.first_name} {ride.passenger.last_name}
                    </p>
                  ) : ride.driver ? (
                    <p>
                      <strong>Motorista:</strong>{" "}
                      {ride.driver.first_name} {ride.driver.last_name}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}

          {(!rides || rides.length === 0) && (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Nenhuma corrida encontrada
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="h-[600px] rounded-lg overflow-hidden">
          {selectedRide ? (
            <RideMap ride={selectedRide} />
          ) : (
            <div className="h-full flex items-center justify-center bg-muted">
              <p className="text-muted-foreground">
                Selecione uma corrida para ver o trajeto
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
