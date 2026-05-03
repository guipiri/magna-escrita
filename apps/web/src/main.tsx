import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import './style.css';
import { CartProvider } from './context/cart-context';
import { CartPage } from './pages/CartPage';
import { PaymentExample } from './pages/PaymentExample';

const App = () => (
  <CartProvider>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/checkout' replace />} />
        <Route path='/checkout' element={<PaymentExample />} />
        <Route path='/cart' element={<CartPage />} />
        <Route path='*' element={<Navigate to='/checkout' replace />} />
      </Routes>
    </BrowserRouter>
  </CartProvider>
);

createRoot(document.getElementById('app')!).render(<App />);
