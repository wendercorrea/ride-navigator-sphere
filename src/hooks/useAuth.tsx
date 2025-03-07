
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import type { Profile } from '@/types/database';
import { User } from '@supabase/supabase-js';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://preview--ride-navigator-sphere.lovable.app';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function resetPassword(email: string) {
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
    }
  }

  async function signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    isDriver: boolean,
    driverInfo?: {
      licensePlate: string;
      vehicleModel: string;
      vehicleColor: string;
      driverLicense: string;
    }
  ) {
    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            phone,
          });

        if (profileError) throw profileError;

        if (isDriver && driverInfo) {
          const { error: driverError } = await supabase
            .from('drivers')
            .insert({
              id: data.user.id,
              license_plate: driverInfo.licensePlate,
              vehicle_model: driverInfo.vehicleModel,
              vehicle_color: driverInfo.vehicleColor,
              driver_license: driverInfo.driverLicense,
              status: 'offline',
            });

          if (driverError) throw driverError;
        }

        toast({
          title: 'Success',
          description: 'Account created successfully',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
