
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const { signIn, signUp, resetPassword, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isDriver, setIsDriver] = useState(false);
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetworkError(false);
    try {
      await signIn(email, password);
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        setNetworkError(true);
      }
    }
  };

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetworkError(false);
    if (!email) {
      return toast({
        title: "Erro",
        description: "Por favor, insira seu email",
        variant: "destructive",
      });
    }
    setIsResetting(true);
    try {
      await resetPassword(email);
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        setNetworkError(true);
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary to-background p-4">
      <Card className="w-full max-w-md p-6 glass-effect">
        {networkError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro de conexão. Verifique sua internet e tente novamente.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full mt-2"
                onClick={handleResetPassword}
                disabled={isResetting}
              >
                {isResetting ? "Enviando..." : "Esqueceu sua senha?"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
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
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
