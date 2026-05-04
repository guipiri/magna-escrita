import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import './style.css';
import { CartProvider } from './context/cart-context';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import BookPage from './pages/BookPage';
import { OrderPage } from './pages/OrderPage';
import { QueryProvider } from './providers/query-provider';

const DEFAULT_BOOK_PATH = '/book/SOFIA-MAGICA-001';

const App = () => (
  <QueryProvider>
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path='/'
            element={<Navigate to={DEFAULT_BOOK_PATH} replace />}
          />
          <Route path='/checkout' element={<CheckoutPage />} />
          <Route path='/order/:orderId' element={<OrderPage />} />
          <Route path='/cart' element={<CartPage />} />
          <Route path='/book/:magnificCode' element={<BookPage />} />
          <Route
            path='*'
            element={<Navigate to={DEFAULT_BOOK_PATH} replace />}
          />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  </QueryProvider>
);

createRoot(document.getElementById('app')!).render(<App />);
