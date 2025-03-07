
import { Button } from "@/components/ui/button";

interface MapLoadingErrorProps {
  isLoading: boolean;
  error: string | null;
}

export const MapLoadingError = ({ isLoading, error }: MapLoadingErrorProps) => {
  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center p-4 text-center">
        <div className="text-destructive mb-2">Erro ao carregar o mapa</div>
        <div className="text-sm text-muted-foreground mb-4">
          {error.includes("API key") 
            ? "Chave de API do Google Maps inválida ou não configurada." 
            : error}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return null;
};
