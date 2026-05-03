import { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  Stack,
  Divider,
} from '@mui/material';
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
    <Container maxWidth='sm' sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant='h5' component='h2' gutterBottom>
            Checkout Transparente
          </Typography>

          {!showBricks && !paymentResult && (
            <Box sx={{ mb: 3 }}>
              <Stack spacing={2}>
                <TextField
                  label='Email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='seu@email.com'
                  required
                  fullWidth
                  variant='outlined'
                />

                <Alert severity='info'>
                  Total do carrinho: R$ {amount.toFixed(2)}
                </Alert>

                {!items.length && (
                  <Alert severity='warning'>
                    O carrinho está vazio. Adicione livros antes de seguir para
                    o pagamento.
                  </Alert>
                )}

                {error && <Alert severity='error'>{error}</Alert>}

                {!publicKey && (
                  <Alert severity='error'>
                    VITE_MERCADOPAGO_PUBLIC_KEY não configurada. Configure no
                    arquivo .env para usar checkout transparente.
                  </Alert>
                )}

                <Button
                  onClick={handleContinueToPayment}
                  disabled={!publicKey || !items.length}
                  fullWidth
                  variant='contained'
                  size='large'
                >
                  Continuar para Pagamento
                </Button>
              </Stack>
            </Box>
          )}

          {showBricks && publicKey && !paymentResult && items.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Alert severity='info' sx={{ mb: 2 }}>
                Total: R$ {amount.toFixed(2)}
              </Alert>

              <Divider sx={{ my: 2 }} />

              <Typography variant='h6' gutterBottom>
                Pagar com Cartão
              </Typography>

              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 3,
                }}
              >
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
              </Box>

              <Typography variant='h6' gutterBottom>
                Ou pague com PIX
              </Typography>

              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
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
              </Box>

              <Button
                onClick={handleReset}
                fullWidth
                variant='outlined'
                size='large'
                sx={{ mt: 2 }}
              >
                Voltar
              </Button>
            </Box>
          )}

          {paymentResult && (
            <Box sx={{ mt: 3 }}>
              <Alert
                severity={
                  paymentResult.status === 'approved' ||
                  paymentResult.status === 'paid'
                    ? 'success'
                    : 'warning'
                }
                sx={{ mb: 2 }}
              >
                Pagamento {paymentResult.status} - ID: {paymentResult.id}
              </Alert>

              {qrImgSrc && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant='subtitle1' gutterBottom>
                    QR Code PIX
                  </Typography>
                  <Box
                    component='img'
                    src={qrImgSrc}
                    alt='QR Code PIX'
                    sx={{ maxWidth: 200, mb: 2 }}
                  />
                  {qrString && (
                    <TextField
                      fullWidth
                      label='PIX Copia e Cola'
                      value={qrString}
                      slotProps={{ input: { readOnly: true } }}
                      sx={{ mb: 2 }}
                    />
                  )}
                </Box>
              )}

              <Button
                onClick={handleReset}
                fullWidth
                variant='contained'
                size='large'
              >
                Novo Pagamento
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
