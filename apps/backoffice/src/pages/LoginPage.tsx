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
      <button
        onClick={handleGoogleLogin}
        className='flex items-center justify-center gap-3 w-full px-6 py-3 bg-white border border-gray-300 rounded-sm shadow-md hover:shadow-lg hover:border-gray-400 transition-all duration-200 hover:cursor-pointer'
      >
        <GoogleSvgLogo />
        <span className='text-gray-700 font-medium'>Entrar com Google</span>
      </button>
    </main>
  );
}

export const GoogleSvgLogo = () => (
  <svg
    width='20'
    height='20'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
      fill='#4285F4'
    />
    <path
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
      fill='#34A853'
    />
    <path
      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
      fill='#FBBC05'
    />
    <path
      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
      fill='#EA4335'
    />
  </svg>
);
