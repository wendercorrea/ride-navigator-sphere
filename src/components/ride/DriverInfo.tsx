
import { Car } from "lucide-react";

interface DriverInfoProps {
  firstName: string;
  lastName: string;
  vehicleModel: string;
  vehicleColor: string;
  licensePlate: string;
}

export function DriverInfo({ 
  firstName, 
  lastName, 
  vehicleModel, 
  vehicleColor, 
  licensePlate 
}: DriverInfoProps) {
  return (
    <div className="p-4 bg-muted rounded-lg space-y-2">
      <div className="flex items-center space-x-2">
        <Car className="w-5 h-5 text-primary" />
        <h3 className="font-medium">Informações do Motorista</h3>
      </div>
      <p className="text-sm">
        Motorista: {firstName} {lastName}
      </p>
      <p className="text-sm">
        Veículo: {vehicleModel} - {vehicleColor}
      </p>
      <p className="text-sm">
        Placa: {licensePlate}
      </p>
    </div>
  );
}
