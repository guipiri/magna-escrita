import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import './style.css';
import { PaymentExample } from './pages/PaymentExample';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<Navigate to='/checkout' replace />} />
      <Route path='/checkout' element={<PaymentExample />} />
      <Route path='*' element={<Navigate to='/checkout' replace />} />
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById('app')!).render(<App />);
