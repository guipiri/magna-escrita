import { useCallback, useMemo, useState } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { createOrder } from '../services/order-service';
import { IBrickError } from '@mercadopago/sdk-react/esm/bricks/util/types/common';
import { ApiError, CreateOrderRes } from '@repo/shared';
import {
  IPaymentBrickCustomization,
  IPaymentFormData,
  TPaymentType,
} from '@mercadopago/sdk-react/esm/bricks/payment/type';
import { CartItem } from '../context/cart-context';
import { useAuth } from '../context/auth-context';
import { getApiError } from '../services/api-error';
import { useMutation } from '@tanstack/react-query';

const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '';
if (publicKey) {
  initMercadoPago(publicKey);
}

const paymentCustomization: IPaymentBrickCustomization = {
  paymentMethods: {
    creditCard: 'all',
    bankTransfer: 'all',
  },
};

export interface CheckoutProps {
  onSuccess: (order: CreateOrderRes) => void;
  onError?: (error: ApiError) => void;
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
  const { user, isLoading: userIsLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [paymentKey, setPaymentKey] = useState(0);

  const cartItems = useMemo(
    () =>
      items.map((item) => ({
        bookId: item.bookId,
        quantity: item.quantity,
      })),
    [items],
  );

  const paymentInitialization: TPaymentType['initialization'] = useMemo(
    () => ({ amount: totalAmount, payer: { email: user?.email || '' } }),
    [totalAmount, user?.email],
  );

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onError: (err) => {
      const apiError = getApiError(err);
      setError(apiError?.message || 'Erro ao criar pedido');
      setPaymentKey((prev) => prev + 1);
      onError?.(apiError);
    },
    onSuccess,
  });

  const handlePaymentSubmit = useCallback(
    async (paymentFormData: IPaymentFormData) => {
      setError(null);

      if (!cartItems.length)
        return setError('Adicione pelo menos um livro ao carrinho');

      const { formData, paymentType } = paymentFormData;
      const payer = formData.payer;
      const identification = payer.identification;

      if (!payer.email) return setError('Email do pagador é obrigatório');

      const isPixPayment =
        paymentType === 'bank_transfer' && formData.payment_method_id === 'pix';

      createOrderMutation.mutateAsync({
        items: cartItems,
        email: payer.email,
        token: formData.token,
        identificationType: identification?.type,
        identificationNumber: identification?.number,
        paymentMethod: isPixPayment ? paymentType : formData.payment_method_id,
        paymentMethodDetail: isPixPayment
          ? formData.payment_method_id
          : undefined,
        installments: isPixPayment ? 1 : formData.installments,
        issuerId: formData.issuer_id,
      });
    },
    [cartItems, onError, onSuccess],
  );

  const handlePaymentError = useCallback(
    (error: IBrickError) => {
      const errorMessage =
        error?.message || 'Erro ao processar pagamento no Mercado Pago';
      setError(errorMessage);
    },
    [onError],
  );

  const canRenderBricks =
    Boolean(publicKey) && items.length > 0 && !userIsLoading;

  if (!canRenderBricks) {
    return (
      <div className='max-w-xl mx-auto'>
        <div>
          <div className='space-y-4 mb-4'>
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
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className='max-w-xl mx-auto mt-4'>
          <div className='bg-red-50 text-red-800 p-3 rounded-md'>{error}</div>
        </div>
      )}
      <Payment
        key={paymentKey}
        initialization={paymentInitialization}
        locale='pt-BR'
        onSubmit={handlePaymentSubmit}
        onError={handlePaymentError}
        customization={paymentCustomization}
      />
    </>
  );
}
