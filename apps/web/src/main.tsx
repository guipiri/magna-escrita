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
import BookPage from './pages/BookPage';
import { OrderPage } from './pages/OrderPage';
import { QueryProvider } from './providers/query-provider';
import { StoreLayout } from './layouts/StoreLayout';
import { useAuth } from './context/auth-context';
import { JSX } from 'react';

const DEFAULT_BOOK_PATH = '/book/r4d3m';
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

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path='/' element={<Navigate to={DEFAULT_BOOK_PATH} replace />} />
        <Route
          path='/checkout'
          element={
            <RequireAuth redirectTo='/cart'>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path='/order/:orderId'
          element={
            <RequireAuth redirectTo='/cart'>
              <OrderPage />
            </RequireAuth>
          }
        />
        <Route path='/cart' element={<CartPage />} />
        <Route path='/book/:magnificCode' element={<BookPage />} />
        <Route path='*' element={<Navigate to={DEFAULT_BOOK_PATH} replace />} />
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
