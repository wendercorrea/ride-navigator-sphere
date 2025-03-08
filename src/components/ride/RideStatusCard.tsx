
import { ArrowRight, Car, Navigation } from "lucide-react";

interface RideStatusCardProps {
  type: "driver-approaching" | "in-progress";
}

export function RideStatusCard({ type }: RideStatusCardProps) {
  if (type === "driver-approaching") {
    return (
      <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Car className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            Motorista a caminho
          </span>
        </div>
        <div className="flex items-center text-xs text-green-600 mt-1">
          <ArrowRight className="w-3 h-3 mr-1 text-green-500" />
          <span>Acompanhe a localização do motorista no mapa</span>
        </div>
      </div>
    );
  }
  
  if (type === "in-progress") {
    return (
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Navigation className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            Navegação em tempo real
          </span>
        </div>
        <p className="text-xs text-blue-600">
          Acompanhe a rota até o destino
        </p>
      </div>
    );
  }
  
  return null;
}
