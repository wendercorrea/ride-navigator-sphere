
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    setLoading(true);
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
      
      // Better error handling
      let errorMessage = 'Failed to create account';
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
    signUp,
    loading
  };
}
