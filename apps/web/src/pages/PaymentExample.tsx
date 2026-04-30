import { MercadoPagoCheckout } from '../components/MercadoPagoCheckout';

export function PaymentExample() {
  const handlePaymentSuccess = (orderId: string | undefined) => {
    console.log('Pagamento criado com sucesso. Order ID:', orderId);
  };

  const handlePaymentError = (error: Error) => {
    console.error('Erro ao criar pagamento:', error);
  };

  return (
    <MercadoPagoCheckout
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
    />
  );
}

export default PaymentExample;
