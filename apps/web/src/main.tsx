import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './style.css';
import { CartProvider } from './context/cart-context';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import BookPage from './pages/BookPage';
import { OrderPage } from './pages/OrderPage';
import { QueryProvider } from './providers/query-provider';

const DEFAULT_BOOK_PATH = '/book/SOFIA-MAGICA-001';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<Navigate to={DEFAULT_BOOK_PATH} replace />} />
      <Route path='/checkout' element={<CheckoutPage />} />
      <Route path='/order/:orderId' element={<OrderPage />} />
      <Route path='/cart' element={<CartPage />} />
      <Route path='/book/:magnificCode' element={<BookPage />} />
      <Route path='*' element={<Navigate to={DEFAULT_BOOK_PATH} replace />} />
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
