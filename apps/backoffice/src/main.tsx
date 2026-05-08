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
import { GradesPage } from './pages/classes';
import { LoginPage } from './pages/login';
import { QueryProvider } from './providers/query-provider';
import { useAuth } from './hooks/auth-hook';
import { JSX } from 'react';
import { UserRole } from '@repo/shared';
import { CreateClass } from './pages/create-class';
import { MainLayout } from './components/layouts/main-layout';
import Home from './pages/home';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const RequireAuth = ({
  children,
  allowedRoles = [UserRole.ADMIN, UserRole.SCHOOL],
  redirectTo = '/login',
}: {
  children: JSX.Element;
  allowedRoles?: UserRole[];
  redirectTo?: To;
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

  if (!user)
    return <Navigate to={redirectTo} replace state={{ from: location }} />;

  const allowed = user.role && allowedRoles.includes(user.role);

  if (!allowed)
    return <Navigate to={redirectTo} replace state={{ from: location }} />;

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
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path='/turmas'
          element={
            <RequireAuth>
              <GradesPage />
            </RequireAuth>
          }
        />
        <Route path='criar-turma' element={<CreateClass />} />
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
