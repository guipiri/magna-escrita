import { useNavigate } from 'react-router-dom';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/auth-hook';
import { useState } from 'react';

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const handleLogin = async (credentialsResponse: CredentialResponse) => {
    await loginWithGoogle({ idToken: credentialsResponse.credential });
    navigate('/');
  };

  return (
    <main className='max-w-md mx-auto mt-20 p-6 bg-white rounded shadow'>
      <h2 className='text-2xl font-semibold mb-4'>Entrar no Backoffice</h2>
      <p className='text-sm text-gray-600 mb-6'>
        Use sua conta Google autorizada.
      </p>
      {error && (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded'>{error}</div>
      )}
      <GoogleLogin
        onSuccess={handleLogin}
        onError={() => {
          setError(
            'Erro ao fazer login com o Google. Por favor, tente novamente.',
          );
        }}
      />
    </main>
  );
}
