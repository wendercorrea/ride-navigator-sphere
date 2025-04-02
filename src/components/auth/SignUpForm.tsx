
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import DriverFields from "./DriverFields";

interface SignUpFormProps {
  email: string;
  setEmail: (email: string) => void;
  setNetworkError: (hasError: boolean) => void;
  loading: boolean;
}

const SignUpForm = ({
  email,
  setEmail,
  setNetworkError,
  loading
}: SignUpFormProps) => {
  const { signUp } = useAuth();
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isDriver, setIsDriver] = useState(false);
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [driverLicense, setDriverLicense] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetworkError(false);
    
    if (isDriver && (!licensePlate || !vehicleModel || !vehicleColor || !driverLicense)) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos do veículo",
        variant: "destructive",
      });
      return;
    }

    try {
      await signUp(
        email, 
        password, 
        firstName, 
        lastName, 
        phone,
        isDriver,
        isDriver ? {
          licensePlate,
          vehicleModel,
          vehicleColor,
          driverLicense,
        } : undefined
      );
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        setNetworkError(true);
      }
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        placeholder="Nome"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
      />
      <Input
        placeholder="Sobrenome"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
      />
      <Input
        type="tel"
        placeholder="Telefone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />

      <div className="space-y-2">
        <Label>Tipo de conta</Label>
        <RadioGroup 
          value={isDriver ? "driver" : "passenger"}
          onValueChange={(value) => setIsDriver(value === "driver")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="passenger" id="passenger" />
            <Label htmlFor="passenger">Passageiro</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="driver" id="driver" />
            <Label htmlFor="driver">Motorista</Label>
          </div>
        </RadioGroup>
      </div>

      {isDriver && (
        <DriverFields
          licensePlate={licensePlate}
          setLicensePlate={setLicensePlate}
          vehicleModel={vehicleModel}
          setVehicleModel={setVehicleModel}
          vehicleColor={vehicleColor}
          setVehicleColor={setVehicleColor}
          driverLicense={driverLicense}
          setDriverLicense={setDriverLicense}
        />
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </form>
  );
};

export default SignUpForm;
