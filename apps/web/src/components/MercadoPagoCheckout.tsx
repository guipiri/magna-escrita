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
import type { OrderResponse } from '@repo/shared';
import {
  ICardPaymentBrickPayer,
  ICardPaymentFormData,
} from '@mercadopago/sdk-react/esm/bricks/cardPayment/type';
import { IBrickError } from '@mercadopago/sdk-react/esm/bricks/util/types/common';

const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '';
if (publicKey) {
  initMercadoPago(publicKey);
}

export interface CheckoutProps {
  onSuccess?: (orderId: string | undefined, paymentData: OrderResponse) => void;
  onError?: (error: Error) => void;
}

export function MercadoPagoCheckout({ onSuccess, onError }: CheckoutProps) {
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<OrderResponse>();
  const [showBricks, setShowBricks] = useState(false);

  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(99.99);

  const handleContinueToPayment = () => {
    setError(null);
    setShowBricks(true);
  };

  const handleCardPaymentSubmit = async (
    cardFormData: ICardPaymentFormData<ICardPaymentBrickPayer>,
  ) => {
    try {
      setError(null);

      const orderResp = await createOrder({
        price: amount,
        quantity: 1,
        email,
        token: cardFormData.token,
        installments: cardFormData.installments,
        payment_method_id: cardFormData.payment_method_id,
        issuer_id: Number(cardFormData.issuer_id),
      });

      console.log('Order criada:', orderResp);

      setPaymentResult(orderResp);
      onSuccess?.(orderResp.id, orderResp);
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

  const handlePixPaymentSubmit = async () => {
    try {
      setError(null);

      const orderResp = await createOrder({
        price: amount,
        quantity: 1,
        email,
        payment_method_id: 'pix',
        description: 'Pagamento PIX',
      });

      console.log('Order PIX criada:', orderResp);

      setPaymentResult(orderResp);
      onSuccess?.(orderResp.id, orderResp);
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

                <TextField
                  label='Valor (R$)'
                  type='number'
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  slotProps={{
                    input: {
                      inputProps: {
                        step: '0.01',
                        min: '0',
                      },
                    },
                  }}
                  required
                  fullWidth
                  variant='outlined'
                />

                {error && <Alert severity='error'>{error}</Alert>}

                {!publicKey && (
                  <Alert severity='error'>
                    VITE_MERCADOPAGO_PUBLIC_KEY não configurada. Configure no
                    arquivo .env para usar checkout transparente.
                  </Alert>
                )}

                <Button
                  onClick={handleContinueToPayment}
                  disabled={!publicKey}
                  fullWidth
                  variant='contained'
                  size='large'
                >
                  Continuar para Pagamento
                </Button>
              </Stack>
            </Box>
          )}

          {showBricks && publicKey && !paymentResult && (
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
                    payer: {
                      email,
                    },
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
