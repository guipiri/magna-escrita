import { useState } from 'react';
import {
  createPaymentPreference,
  PaymentData,
} from '../services/paymentService';

export interface CheckoutProps {
  onSuccess?: (preferenceId: string) => void;
  onError?: (error: Error) => void;
}

export function MercadoPagoCheckout({ onSuccess, onError }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PaymentData>({
    title: 'Produto Exemplo',
    quantity: 1,
    price: 99.99,
    description: 'Descrição do produto',
    email: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'quantity' || name === 'price'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const preference = await createPaymentPreference(formData);

      if (preference.init_point) {
        // Redirecionar para o Mercado Pago
        window.location.href = preference.init_point;

        onSuccess?.(preference.id);
      } else if (preference.sandbox_init_point) {
        // Modo sandbox
        window.location.href = preference.sandbox_init_point;

        onSuccess?.(preference.id);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao processar pagamento';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='payment-checkout'>
      <h2>Checkout - Mercado Pago</h2>

      <form onSubmit={handleSubmit} className='checkout-form'>
        <div className='form-group'>
          <label htmlFor='email'>Email:</label>
          <input
            id='email'
            type='email'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            placeholder='seu@email.com'
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='title'>Título do Produto:</label>
          <input
            id='title'
            type='text'
            name='title'
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='description'>Descrição:</label>
          <textarea
            id='description'
            name='description'
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        <div className='form-row'>
          <div className='form-group'>
            <label htmlFor='price'>Preço (R$):</label>
            <input
              id='price'
              type='number'
              name='price'
              value={formData.price}
              onChange={handleInputChange}
              step='0.01'
              min='0'
              required
            />
          </div>

          <div className='form-group'>
            <label htmlFor='quantity'>Quantidade:</label>
            <input
              id='quantity'
              type='number'
              name='quantity'
              value={formData.quantity}
              onChange={handleInputChange}
              min='1'
              required
            />
          </div>
        </div>

        {error && <div className='error-message'>{error}</div>}

        <button type='submit' disabled={loading} className='submit-button'>
          {loading ? 'Processando...' : 'Ir para Mercado Pago'}
        </button>
      </form>

      <style>{`
        .payment-checkout {
          max-width: 500px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 5px;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .error-message {
          padding: 10px;
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          color: #c33;
        }

        .submit-button {
          padding: 12px;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .submit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
