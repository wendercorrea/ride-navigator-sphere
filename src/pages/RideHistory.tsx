
import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Ride, Profile } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Calendar, Clock, Car } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { RideMap } from "@/components/RideMap";

type RideWithProfiles = Ride & {
  passenger: Profile;
  driver: Profile | null;
};

export default function RideHistory() {
  const { user } = useAuth();
  const [rides, setRides] = useState<RideWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRideHistory = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('rides')
          .select(`
            *,
            passenger:profiles!rides_passenger_id_fkey(*),
            driver:profiles!rides_driver_id_fkey(*)
          `)
          .or(`passenger_id.eq.${user.id},driver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setRides(data || []);
      } catch (error) {
        console.error("Error fetching ride history:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico de corridas",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRideHistory();
  }, [user]);

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

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "text-yellow-500",
      accepted: "text-blue-500",
      in_progress: "text-purple-500",
      completed: "text-green-500",
      cancelled: "text-red-500"
    };
    return colorMap[status] || "text-gray-500";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <CardTitle className="mb-6">Histórico de Corridas</CardTitle>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <CardTitle className="mb-6">Histórico de Corridas</CardTitle>
      
      {rides.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma corrida encontrada no histórico.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <Card key={ride.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Status e Data */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-semibold ${getStatusColor(ride.status)}`}>
                          {getStatusText(ride.status)}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(ride.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{format(new Date(ride.created_at), "HH:mm")}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R$ {ride.estimated_price.toFixed(2)}</p>
                        {ride.final_price && (
                          <p className="text-sm text-muted-foreground">
                            Final: R$ {ride.final_price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

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
                    <div className="space-y-2">
                      {user?.id === ride.passenger_id ? (
                        ride.driver && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Car className="w-4 h-4" />
                            <span className="font-medium">Motorista:</span>
                            <span>
                              {ride.driver.first_name} {ride.driver.last_name}
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center space-x-2 text-sm">
                          <Car className="w-4 h-4" />
                          <span className="font-medium">Passageiro:</span>
                          <span>
                            {ride.passenger.first_name} {ride.passenger.last_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mapa */}
                  <div className="h-[200px] lg:h-[300px] rounded-lg overflow-hidden">
                    <RideMap ride={ride} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
