
import { useAuthState } from './useAuthState';
import { useSignIn } from './useSignIn';
import { useSignUp } from './useSignUp';
import { useSignOut } from './useSignOut';
import { usePasswordReset } from './usePasswordReset';
import { useProfileManagement } from './useProfileManagement';
import { useEffect } from 'react';

export function useAuth() {
  const { user, loading: authLoading } = useAuthState();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { signOut } = useSignOut();
  const { resetPassword } = usePasswordReset();
  const { 
    profile, 
    loadProfile, 
    loading: profileLoading 
  } = useProfileManagement(user);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  return {
    user,
    profile,
    loading: authLoading || profileLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
