
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Ride } from "@/types/database";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";
import { RideFilters } from "@/components/ride/RideFilters";
import { RideList } from "@/components/ride/RideList";
import { LoadingState } from "@/components/ride/LoadingState";

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

export default function RideHistory() {
  const { user } = useAuth();
  const [rides, setRides] = useState<ExtendedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RideStatus | null>(null);

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

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Histórico de Corridas</CardTitle>
          <CardDescription>Seus deslocamentos recentes</CardDescription>
        </CardHeader>
        <RideFilters 
          currentFilter={filter} 
          onFilterChange={setFilter} 
        />
      </Card>
      
      <RideList 
        rides={rides} 
        userId={user?.id || ''} 
        filter={filter} 
      />
    </div>
  );
}
