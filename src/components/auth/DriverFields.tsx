
import { Input } from "@/components/ui/input";

interface DriverFieldsProps {
  licensePlate: string;
  setLicensePlate: (value: string) => void;
  vehicleModel: string;
  setVehicleModel: (value: string) => void;
  vehicleColor: string;
  setVehicleColor: (value: string) => void;
  driverLicense: string;
  setDriverLicense: (value: string) => void;
}

const DriverFields = ({
  licensePlate,
  setLicensePlate,
  vehicleModel,
  setVehicleModel,
  vehicleColor,
  setVehicleColor,
  driverLicense,
  setDriverLicense
}: DriverFieldsProps) => {
  return (
    <div className="space-y-4">
      <Input
        placeholder="Placa do Veículo"
        value={licensePlate}
        onChange={(e) => setLicensePlate(e.target.value)}
        required
      />
      <Input
        placeholder="Modelo do Veículo"
        value={vehicleModel}
        onChange={(e) => setVehicleModel(e.target.value)}
        required
      />
      <Input
        placeholder="Cor do Veículo"
        value={vehicleColor}
        onChange={(e) => setVehicleColor(e.target.value)}
        required
      />
      <Input
        placeholder="CNH"
        value={driverLicense}
        onChange={(e) => setDriverLicense(e.target.value)}
        required
      />
    </div>
  );
};

export default DriverFields;
