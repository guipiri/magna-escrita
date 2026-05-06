import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthUser, GoogleAuthRequest } from '@repo/shared';
import { fetchMe, signInWithGoogle, signOut } from '../services/auth-service';
import { useNavigate } from 'react-router-dom';

const AUTH_QUERY_KEY = ['auth', 'me'] as const;

interface AuthHookValue {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  loginWithGoogle: (payload: GoogleAuthRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(): AuthHookValue {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const meQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const loginMutation = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      navigate('/login');
    },
  });

  const user = meQuery.data?.user ?? null;
  const isLoading =
    meQuery.isLoading || loginMutation.isPending || logoutMutation.isPending;

  const error = useMemo(() => {
    if (loginMutation.isError) {
      return 'Nao foi possivel autenticar com o Google.';
    }

    if (logoutMutation.isError) return 'Nao foi possivel sair agora.';

    return null;
  }, [loginMutation.isError, logoutMutation.isError]);

  const loginWithGoogle = async (payload: GoogleAuthRequest) => {
    await loginMutation.mutateAsync(payload);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
  };

  return {
    user,
    isLoading,
    error,
    loginWithGoogle,
    logout,
    refresh,
  };
}
