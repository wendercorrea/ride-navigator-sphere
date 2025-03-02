
import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Ride } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Calendar, Clock, Car, User, DollarSign, BadgeCheck } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { RideMap } from "@/components/RideMap";

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

export default function RideHistory() {
  const { user } = useAuth();
  const [rides, setRides] = useState<ExtendedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchRideHistory = async () => {
      if (!user) return;

      try {
        const query = supabase
          .from('rides')
          .select(`
            *,
            passenger:profiles!rides_passenger_id_fkey(
              first_name,
              last_name
            ),
            driver:profiles!rides_driver_id_fkey(
              first_name,
              last_name
            )
          `);

        const { data: driverCheck } = await supabase
          .from('drivers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (driverCheck) {
          query.eq('driver_id', user.id);
        } else {
          query.eq('passenger_id', user.id);
        }

        if (filter) {
          query.eq('status', filter);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Convertemos explicitamente o tipo dos dados retornados
        const formattedRides = (data as any[]).map(ride => ({
          ...ride,
          passenger: ride.passenger,
          driver: ride.driver ? ride.driver[0] : null // Corrigindo o array para objeto único
        }));

        setRides(formattedRides as ExtendedRide[]);
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
  }, [user, filter]);

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
      pending: "text-yellow-500 bg-yellow-50",
      accepted: "text-blue-500 bg-blue-50",
      in_progress: "text-purple-500 bg-purple-50",
      completed: "text-green-500 bg-green-50",
      cancelled: "text-red-500 bg-red-50"
    };
    return colorMap[status] || "text-gray-500 bg-gray-50";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <BadgeCheck className="h-4 w-4" />;
      case 'in_progress':
        return <Car className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <User className="h-4 w-4" />;
      case 'cancelled':
        return <MapPin className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Histórico de Corridas</CardTitle>
            <CardDescription>Seus deslocamentos recentes</CardDescription>
          </CardHeader>
        </Card>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Histórico de Corridas</CardTitle>
          <CardDescription>Seus deslocamentos recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              onClick={() => setFilter(null)} 
              className={`px-3 py-1 rounded-full text-sm ${!filter ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
            >
              Todas
            </button>
            {['completed', 'cancelled', 'pending', 'accepted', 'in_progress'].map(status => (
              <button 
                key={status} 
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${filter === status ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
              >
                {getStatusIcon(status)}
                {getStatusText(status)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {rides.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {filter ? `Nenhuma corrida com status "${getStatusText(filter)}" encontrada.` : "Nenhuma corrida encontrada no histórico."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {rides.map((ride) => (
            <Card key={ride.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center gap-1 ${getStatusColor(ride.status)}`}>
                          {getStatusIcon(ride.status)}
                          {getStatusText(ride.status)}
                        </span>
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
                      {user?.id === ride.passenger_id ? (
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
          ))}
        </div>
      )}
    </div>
  );
}
