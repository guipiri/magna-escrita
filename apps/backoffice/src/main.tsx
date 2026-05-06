import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  To,
  useLocation,
} from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './style.css';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { QueryProvider } from './providers/query-provider';
import { useAuth } from './hooks/auth-hook';
import { JSX } from 'react';
import { MainLayout } from './layouts/MainLayout';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const RequireAdmin = ({
  children,
  redirectTo,
}: {
  children: JSX.Element;
  redirectTo: To;
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className='px-4 py-12 text-center'>
        Verificando autenticacao...
      </main>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  const allowed =
    user.role && (user.role === 'ADMIN' || user.role === 'SCHOOL');

  if (!allowed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route element={<MainLayout />}>
        <Route
          path='/'
          element={
            <RequireAdmin redirectTo='/login'>
              <HomePage />
            </RequireAdmin>
          }
        />
      </Route>
    </Routes>
  </BrowserRouter>
);

const App = () => {
  const content = (
    <QueryProvider>
      <AppRoutes />
    </QueryProvider>
  );

  if (!GOOGLE_CLIENT_ID) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
};

createRoot(document.getElementById('app')!).render(<App />);
