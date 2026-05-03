import { useState } from 'react';
import { Button } from './Button';
import { initMercadoPago, CardPayment, Payment } from '@mercadopago/sdk-react';
import { createOrder } from '../services/paymentService';
import {
  ICardPaymentBrickPayer,
  ICardPaymentFormData,
} from '@mercadopago/sdk-react/esm/bricks/cardPayment/type';
import { IBrickError } from '@mercadopago/sdk-react/esm/bricks/util/types/common';
import { OrderResponse } from '@repo/shared';
import { IPaymentFormData } from '@mercadopago/sdk-react/esm/bricks/payment/type';
import { CartItem } from '../context/cart-context';
import { findBookById } from '../data/books';

const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '';
if (publicKey) {
  initMercadoPago(publicKey);
}

export interface CheckoutProps {
  onSuccess?: (orderId: string | undefined, paymentData: OrderResponse) => void;
  onError?: (error: Error) => void;
  items: CartItem[];
}

export function MercadoPagoCheckout({
  onSuccess,
  onError,
  items,
}: CheckoutProps) {
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<OrderResponse>();
  const [showBricks, setShowBricks] = useState(false);

  const [email, setEmail] = useState('');

  const amount = items.reduce((sum, item) => {
    const book = findBookById(item.bookId);

    if (!book) {
      return sum;
    }

    return sum + book.price * item.quantity;
  }, 0);

  const handleContinueToPayment = () => {
    setError(null);
    setShowBricks(true);
  };

  const handleCardPaymentSubmit = async (
    cardFormData: ICardPaymentFormData<ICardPaymentBrickPayer>,
  ) => {
    try {
      setError(null);
      const identification = cardFormData.payer.identification;

      if (!cardFormData.payer.email)
        return setError('Email do pagador é obrigatório');

      if (!items.length) {
        return setError('Adicione pelo menos um livro ao carrinho');
      }

      const orderResp = await createOrder({
        items: items.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity,
        })),
        email: cardFormData.payer.email,
        token: cardFormData.token,
        identificationType: identification?.type,
        identificationNumber: identification?.number,
        paymentMethod: cardFormData.payment_method_id,
        installments: cardFormData.installments,
        issuerId: cardFormData.issuer_id,
      });

      setPaymentResult(orderResp.mpOrder);
      onSuccess?.(orderResp.mpOrder.id, orderResp.mpOrder);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao processar pagamento';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    }
  };

  const handleCardPaymentError = (error: IBrickError) => {
    setError(error?.message);
    onError?.(new Error(error?.message));
  };

  const handlePixPaymentSubmit = async (pixFormData: IPaymentFormData) => {
    try {
      setError(null);
      const payer = pixFormData.formData.payer;
      const identification = payer.identification;

      if (!items.length) {
        return setError('Adicione pelo menos um livro ao carrinho');
      }

      const orderResp = await createOrder({
        items: items.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity,
        })),
        email: payer.email,
        installments: 1,
        identificationNumber: identification?.number,
        identificationType: identification?.type,
        paymentMethod: pixFormData.paymentType,
        paymentMethodDetail: pixFormData.formData.payment_method_id,
        issuerId: pixFormData.formData.issuer_id,
      });

      setPaymentResult(orderResp.mpOrder);
      onSuccess?.(orderResp.mpOrder.id, orderResp.mpOrder);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao criar PIX';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    }
  };

  const handlePixPaymentError = (error: IBrickError) => {
    const errorMessage = error?.message || 'Erro ao processar pagamento PIX';
    setError(errorMessage);
    onError?.(new Error(errorMessage));
  };

  const handleReset = () => {
    setShowBricks(false);
    setPaymentResult(undefined);
    setError(null);
  };

  const paymentMethod =
    paymentResult?.transactions?.payments?.[0].payment_method;
  const qrBase64 = paymentMethod?.qr_code_base64;
  const qrString = paymentMethod?.qr_code;
  const qrImgSrc = qrBase64 ? `data:image/png;base64,${qrBase64}` : undefined;

  return (
    <div className='max-w-xl mx-auto py-6'>
      <div className='bg-white rounded-2xl shadow-md p-6'>
        <h2 className='text-2xl font-bold mb-4'>Checkout Transparente</h2>

        {!showBricks && !paymentResult && (
          <div className='space-y-4 mb-4'>
            <input
              className='w-full border border-gray-200 rounded-md px-4 py-2'
              placeholder='seu@email.com'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className='bg-blue-50 text-blue-800 p-3 rounded-md'>
              Total do carrinho: R$ {amount.toFixed(2)}
            </div>

            {!items.length && (
              <div className='bg-yellow-50 text-yellow-800 p-3 rounded-md'>
                O carrinho está vazio. Adicione livros antes de seguir para o
                pagamento.
              </div>
            )}

            {error && (
              <div className='bg-red-50 text-red-800 p-3 rounded-md'>
                {error}
              </div>
            )}

            {!publicKey && (
              <div className='bg-red-50 text-red-800 p-3 rounded-md'>
                VITE_MERCADOPAGO_PUBLIC_KEY não configurada. Configure no
                arquivo .env para usar checkout transparente.
              </div>
            )}

            <Button onClick={handleContinueToPayment} className='w-full'>
              Continuar para Pagamento
            </Button>
          </div>
        )}

        {showBricks && publicKey && !paymentResult && items.length > 0 && (
          <div className='mt-3 space-y-4'>
            <div className='bg-blue-50 text-blue-800 p-3 rounded-md'>
              Total: R$ {amount.toFixed(2)}
            </div>

            <div className='border-t border-gray-100' />

            <h3 className='text-lg font-semibold'>Pagar com Cartão</h3>

            <div className='p-3 border rounded-md'>
              <CardPayment
                initialization={{
                  amount,
                  payer: email ? { email } : undefined,
                }}
                locale='pt-BR'
                onSubmit={handleCardPaymentSubmit}
                onError={handleCardPaymentError}
                customization={{
                  paymentMethods: {
                    types: {
                      included: ['credit_card', 'debit_card'],
                    },
                  },
                }}
              />
            </div>

            <h3 className='text-lg font-semibold'>Ou pague com PIX</h3>

            <div className='p-3 border rounded-md'>
              <Payment
                initialization={{
                  amount,
                  payer: {
                    email,
                  },
                }}
                locale='pt-BR'
                onSubmit={handlePixPaymentSubmit}
                onError={handlePixPaymentError}
                customization={{
                  paymentMethods: {
                    bankTransfer: 'all',
                  },
                }}
              />
            </div>

            <Button
              onClick={handleReset}
              variant='secondary'
              className='w-full'
            >
              Voltar
            </Button>
          </div>
        )}

        {paymentResult && (
          <div className='mt-3 space-y-4'>
            <div
              className={`p-3 rounded-md ${
                paymentResult.status === 'approved' ||
                paymentResult.status === 'paid'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-yellow-50 text-yellow-800'
              }`}
            >
              Pagamento {paymentResult.status} - ID: {paymentResult.id}
            </div>

            {qrImgSrc && (
              <div className='mt-2 text-center'>
                <div className='text-base font-medium mb-2'>QR Code PIX</div>
                <img
                  src={qrImgSrc}
                  alt='QR Code PIX'
                  className='mx-auto mb-2 max-w-[200px]'
                />
                {qrString && (
                  <textarea
                    readOnly
                    className='w-full border border-gray-200 rounded-md p-2'
                    value={qrString}
                  />
                )}
              </div>
            )}

            <Button onClick={handleReset} className='w-full'>
              Novo Pagamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
