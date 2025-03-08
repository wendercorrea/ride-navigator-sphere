
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import type { Ride } from "@/types/database";

interface ActionButtonsProps {
  ride: Ride;
  isDriver: boolean;
  loading: boolean;
  onCancel: () => void;
  onConclude: () => void;
  onAccept?: () => void;
  isAccepting?: boolean;
}

export function ActionButtons({ 
  ride, 
  isDriver, 
  loading,
  onCancel, 
  onConclude,
  onAccept,
  isAccepting
}: ActionButtonsProps) {
  // Driver sees "Accept Ride" button for pending rides
  if (isDriver && ride.status === 'pending') {
    return (
      <Button 
        className="w-full"
        onClick={onAccept}
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
    );
  }
  
  // Passenger sees "Cancel" button for pending rides
  if (!isDriver && ride.status === 'pending') {
    return (
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
          <>
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar Solicitação de Transporte
          </>
        )}
      </Button>
    );
  }
  
  // For rides that are accepted or in progress
  return (
    <Button 
      variant="default"
      onClick={onConclude} 
      disabled={loading}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          {isDriver 
            ? ride.status === 'accepted' 
              ? "Iniciar Corrida" 
              : "Finalizar Corrida"
            : ride.status === 'in_progress'
              ? "Finalizar Corrida"
              : "Confirmar Embarque"
          }
        </>
      )}
    </Button>
  );
}
