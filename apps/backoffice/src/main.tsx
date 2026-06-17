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
import { SnackbarProvider } from 'notistack';
import './style.css';
import { ClassesPage } from './pages/classes';
import { LoginPage } from './pages/login';
import { QueryProvider } from './providers/query-provider';
import { useAuth } from './hooks/auth-hook';
import { JSX } from 'react';
import { UserRole } from '@repo/shared';
import { MainLayout } from './components/layouts/main-layout';
import Home from './pages/home';
import { BookTemplatesPage } from './pages/book-templates';
import { EventsPage } from './pages/events';
import { BooksPage } from './pages/books';
import { BookDetailPage } from './pages/book-detail';
import { UsersPage } from './pages/users';

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
              <ClassesPage />
            </RequireAuth>
          }
        />
        <Route
          path='/book-templates'
          element={
            <RequireAuth allowedRoles={[UserRole.ADMIN]}>
              <BookTemplatesPage />
            </RequireAuth>
          }
        />
        <Route
          path='/usuarios'
          element={
            <RequireAuth allowedRoles={[UserRole.ADMIN]}>
              <UsersPage />
            </RequireAuth>
          }
        />
        <Route
          path='/eventos'
          element={
            <RequireAuth>
              <EventsPage />
            </RequireAuth>
          }
        />
        <Route
          path='/livros'
          element={
            <RequireAuth>
              <BooksPage />
            </RequireAuth>
          }
        />
        <Route
          path='/livros/:id'
          element={
            <RequireAuth>
              <BookDetailPage />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  </BrowserRouter>
);

const App = () => {
  const content = (
    <QueryProvider>
      <SnackbarProvider
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={3000}
      >
        <AppRoutes />
      </SnackbarProvider>
    </QueryProvider>
  );

  if (!GOOGLE_CLIENT_ID) return content;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
};

createRoot(document.getElementById('app')!).render(<App />);
