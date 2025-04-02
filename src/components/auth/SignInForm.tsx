
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

interface SignInFormProps {
  email: string;
  setEmail: (email: string) => void;
  isResetting: boolean;
  setIsResetting: (isResetting: boolean) => void;
  setNetworkError: (hasError: boolean) => void;
  loading: boolean;
}

const SignInForm = ({
  email,
  setEmail,
  isResetting,
  setIsResetting,
  setNetworkError,
  loading
}: SignInFormProps) => {
  const { signIn, resetPassword } = useAuth();
  const [password, setPassword] = useState("");

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
  );
};

export default SignInForm;
