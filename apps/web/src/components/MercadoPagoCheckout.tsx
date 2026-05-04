import { useState } from 'react';
import { initMercadoPago, CardPayment, Payment } from '@mercadopago/sdk-react';
import { createOrder } from '../services/payment-service';
import {
  ICardPaymentBrickPayer,
  ICardPaymentFormData,
} from '@mercadopago/sdk-react/esm/bricks/cardPayment/type';
import { IBrickError } from '@mercadopago/sdk-react/esm/bricks/util/types/common';
import { OrderResponse } from '@repo/shared';
import { IPaymentFormData } from '@mercadopago/sdk-react/esm/bricks/payment/type';
import { CartItem } from '../context/cart-context';

const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '';
if (publicKey) {
  initMercadoPago(publicKey);
}

export interface CheckoutProps {
  onSuccess?: (orderId: string | undefined, paymentData: OrderResponse) => void;
  onError?: (error: Error) => void;
  items: CartItem[];
  totalAmount: number;
  disabledReason?: string;
}

export function MercadoPagoCheckout({
  onSuccess,
  onError,
  items,
  totalAmount,
}: CheckoutProps) {
  const [error, setError] = useState<string | null>(null);

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

  const canRenderBricks = Boolean(publicKey) && items.length > 0;

  return (
    <div className='max-w-xl mx-auto'>
      <div>
        {!canRenderBricks && (
          <div className='space-y-4 mb-4'>
            <div className='bg-blue-50 text-blue-800 p-3 rounded-md'>
              Total do carrinho: R$ {totalAmount.toFixed(2)}
            </div>

            {!items.length && (
              <div className='bg-yellow-50 text-yellow-800 p-3 rounded-md'>
                {
                  'O carrinho está vazio. Adicione livros antes de seguir para o pagamento.'
                }
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
          </div>
        )}

        {canRenderBricks && (
          <div className='mt-3 space-y-4'>
            {error && (
              <div className='bg-red-50 text-red-800 p-3 rounded-md'>
                {error}
              </div>
            )}

            <div className='border-t border-gray-100' />

            <h3 className='text-lg font-semibold'>Pagar com Cartão</h3>

            <div className='p-3 border rounded-md'>
              <CardPayment
                initialization={{ amount: totalAmount }}
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
                initialization={{ amount: totalAmount }}
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
          </div>
        )}
      </div>
    </div>
  );
}
