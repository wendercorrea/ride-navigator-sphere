
import { useAuthState } from './auth/useAuthState';
import { useSignIn } from './auth/useSignIn';
import { useSignUp } from './auth/useSignUp';
import { useSignOut } from './auth/useSignOut';
import { usePasswordReset } from './auth/usePasswordReset';
import { useProfileManagement } from './auth/useProfileManagement';
import { useEffect, useCallback } from 'react';

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

  // Use useCallback to prevent recreation of loadProfile function on each render
  const stableLoadProfile = useCallback(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  useEffect(() => {
    stableLoadProfile();
  }, [stableLoadProfile]);

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
