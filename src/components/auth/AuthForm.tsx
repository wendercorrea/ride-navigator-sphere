
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

const AuthForm = () => {
  const { loading } = useAuth();
  const [email, setEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [networkError, setNetworkError] = useState(false);

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
            <SignInForm 
              email={email}
              setEmail={setEmail}
              isResetting={isResetting}
              setIsResetting={setIsResetting}
              setNetworkError={setNetworkError}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="signup">
            <SignUpForm
              email={email}
              setEmail={setEmail}
              setNetworkError={setNetworkError}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AuthForm;
