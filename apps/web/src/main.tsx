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
import { CartProvider } from './context/cart-context';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import BookPage from './pages/BookPage';
import { OrderPage } from './pages/OrderPage';
import { QueryProvider } from './providers/query-provider';
import { StoreLayout } from './layouts/StoreLayout';
import { useAuth } from './context/auth-context';
import { JSX } from 'react';
import { OrdersPage } from './pages/OrdersPage';
import { ReadBookPage } from './pages/ReadBookPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const RequireAuth = ({
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

  return children;
};

export const routes = {
  HOME: { path: '/', element: <HomePage />, isPublic: true },
  CART: { path: '/cart', element: <CartPage />, isPublic: true },
  CHECKOUT: { path: '/checkout', element: <CheckoutPage />, isPublic: false },
  ORDER: { path: '/order/:orderId', element: <OrderPage />, isPublic: false },
  ORDERS: { path: '/orders', element: <OrdersPage />, isPublic: false },
  BOOK: {
    path: '/book/:magnificCode',
    element: <BookPage />,
    isPublic: true,
    pathGenerator: (magnificCode: string) => `/book/${magnificCode}`,
  },
  READ: {
    path: '/book/:magnificCode/read',
    element: <ReadBookPage />,
    pathGenerator: (magnificCode: string) => `/book/${magnificCode}/read`,
    isPublic: true,
  },
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<StoreLayout />}>
        {Object.entries(routes).map(([_, route]) =>
          route.isPublic ? (
            <Route path={route.path} element={route.element} />
          ) : (
            <Route
              path={route.path}
              element={
                <RequireAuth redirectTo={routes.CART.path}>
                  {route.element}
                </RequireAuth>
              }
            />
          ),
        )}

        <Route path='*' element={<Navigate to={routes.HOME.path} replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

const App = () => {
  const content = (
    <QueryProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
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
