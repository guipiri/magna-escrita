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
import Home from './pages/schools';
import { BookTemplatesPage } from './pages/book-templates';
import { EventsPage } from './pages/events';
import { BooksPage } from './pages/books';
import { BookDetailPage } from './pages/book-detail';
import { UsersPage } from './pages/users';
import { PricesPage } from './pages/prices';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const RequireAuth = ({
  children,
  allowedRoles = defaultBackofficeAllowedRoles,
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

const defaultBackofficeAllowedRoles = [UserRole.ADMIN, UserRole.SCHOOL];

export const routes = {
  login: {
    path: '/login',
    allowedRoles: defaultBackofficeAllowedRoles,
  },
  schools: {
    path: '/escolas',
    allowedRoles: defaultBackofficeAllowedRoles,
  },
  classes: {
    path: '/turmas',
    allowedRoles: defaultBackofficeAllowedRoles,
  },
  bookTemplates: {
    path: '/book-templates',
    allowedRoles: [UserRole.ADMIN],
  },
  users: {
    path: '/usuarios',
    allowedRoles: [UserRole.ADMIN],
  },
  events: {
    path: '/eventos',
    allowedRoles: [UserRole.ADMIN],
  },
  books: {
    path: '/livros',
    allowedRoles: defaultBackofficeAllowedRoles,
  },
  bookDetail: {
    path: '/livros/:id',
    allowedRoles: defaultBackofficeAllowedRoles,
  },
  prices: {
    path: '/precos',
    allowedRoles: [UserRole.ADMIN],
  },
};

const RootRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className='px-4 py-12 text-center'>
        Verificando autenticacao...
      </main>
    );
  }

  if (user) {
    return <Navigate to={routes.schools.path} replace />;
  }

  return <Navigate to={routes.login.path} replace />;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path={routes.login.path} element={<LoginPage />} />
      <Route element={<MainLayout />}>
        <Route
          path={routes.schools.path}
          element={
            <RequireAuth
              allowedRoles={routes.schools.allowedRoles}
              redirectTo={routes.login.path}
            >
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path={routes.classes.path}
          element={
            <RequireAuth>
              <ClassesPage />
            </RequireAuth>
          }
        />
        <Route
          path={routes.bookTemplates.path}
          element={
            <RequireAuth allowedRoles={routes.bookTemplates.allowedRoles}>
              <BookTemplatesPage />
            </RequireAuth>
          }
        />
        <Route
          path={routes.users.path}
          element={
            <RequireAuth allowedRoles={routes.users.allowedRoles}>
              <UsersPage />
            </RequireAuth>
          }
        />
        <Route
          path={routes.events.path}
          element={
            <RequireAuth allowedRoles={routes.events.allowedRoles}>
              <EventsPage />
            </RequireAuth>
          }
        />
        <Route
          path={routes.books.path}
          element={
            <RequireAuth>
              <BooksPage />
            </RequireAuth>
          }
        />
        <Route
          path={routes.bookDetail.path}
          element={
            <RequireAuth>
              <BookDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path={routes.prices.path}
          element={
            <RequireAuth allowedRoles={routes.prices.allowedRoles}>
              <PricesPage />
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
