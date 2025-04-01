
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://preview--ride-navigator-sphere.lovable.app';

export function usePasswordReset() {
  const [loading, setLoading] = useState(false);

  async function resetPassword(email: string) {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/auth/reset-password`,
      });
      if (error) throw error;
      toast({
        title: 'Sucesso',
        description: `As instruções de reset de senha foram enviadas para ${email}. Por favor, verifique sua caixa de entrada.`,
      });
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    resetPassword,
    loading
  };
}
