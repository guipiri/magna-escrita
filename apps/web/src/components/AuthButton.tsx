import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useAuth } from '../context/auth-context';

export function AuthButton() {
  const { user, isLoading, error, loginWithGoogle, logout } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  if (!googleEnabled) {
    return (
      <span className='text-xs text-gray-500'>Google auth desativado</span>
    );
  }

  if (isLoading) {
    return <span className='text-xs text-gray-500'>Carregando...</span>;
  }

  if (user) {
    return (
      <div className='flex items-center gap-3'>
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className='w-8 h-8 rounded-full border border-white shadow'
          />
        ) : (
          <div className='w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center'>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className='hidden md:inline text-sm text-gray-700'>
          {user.name}
        </span>
        <button
          type='button'
          onClick={() => void logout()}
          className='px-3 py-1 text-xs rounded-full bg-white text-purple-600 shadow-sm hover:shadow transition-all'
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-end gap-1'>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          const credential = credentialResponse.credential;
          if (credential) {
            setLocalError(null);
            void loginWithGoogle(credential);
          }
        }}
        onError={() => {
          setLocalError('Falha ao autenticar com o Google.');
        }}
        useOneTap
      />
      {error || localError ? (
        <span className='text-xs text-red-600'>{error ?? localError}</span>
      ) : null}
    </div>
  );
}
