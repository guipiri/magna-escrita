import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/auth-hook';
import { useState } from 'react';

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const { loginWithGoogle, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (tokenResponse) => {
      await loginWithGoogle({ code: tokenResponse.code });
      navigate('/');
    },
    onError: () => {
      console.error('Google login failed');
      setError('Falha na autenticação com o Google.');
    },
  });

  return (
    <main className='max-w-md mx-auto mt-20 p-6 bg-white rounded shadow'>
      <h2 className='text-2xl font-semibold mb-4'>Entrar no Backoffice</h2>
      <p className='text-sm text-gray-600 mb-6'>
        Use sua conta Google autorizada.
      </p>
      {error || authError ? (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded'>
          {error || authError}
        </div>
      ) : null}
      <button onClick={handleGoogleLogin}>Fazer login com o Google</button>
    </main>
  );
}
