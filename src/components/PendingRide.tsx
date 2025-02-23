
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { RideMap } from "@/components/RideMap";
import type { Ride } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRideDriver } from "@/hooks/ride/useRideDriver";
import { useAuth } from "@/hooks/useAuth";

interface PendingRideProps {
  ride: Ride;
  onCancel: () => void;
  loading?: boolean;
}

export function PendingRide({ ride, onCancel, loading }: PendingRideProps) {
  const { acceptRide } = useRideDriver();
  const { user } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);

  // Verifica se o usuário atual é motorista
  const [isDriver, setIsDriver] = useState(false);
  
  useEffect(() => {
    const checkIfDriver = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("id")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setIsDriver(!!data);
      } catch (error) {
        console.error("Error checking driver status:", error);
      }
    };

    checkIfDriver();
  }, [user?.id]);

  const handleAcceptRide = async () => {
    setIsAccepting(true);
    try {
      await acceptRide(ride.id);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Corrida Solicitada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {/* Data e Hora */}
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

            {/* Endereços */}
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

            {/* Botões de ação */}
            <div className="space-y-2">
              {isDriver ? (
                <>
                  <Button 
                    className="w-full"
                    onClick={handleAcceptRide}
                    disabled={isAccepting || loading}
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aceitando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aceitar Corrida
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={onCancel} 
                    disabled={isAccepting || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Recusar Corrida
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="destructive" 
                  onClick={onCancel} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Cancelar Corrida'
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="h-[200px] md:h-full relative rounded-lg overflow-hidden">
            <RideMap ride={ride} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
