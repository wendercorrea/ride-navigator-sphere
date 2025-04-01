
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export function useSignIn() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function signIn(email: string, password: string) {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
      
      // Better error handling
      let errorMessage = 'Failed to sign in';
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    signIn,
    loading
  };
}
