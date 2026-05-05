import { useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clipboard,
  Clock,
  Home,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { GetOrderRes, OrderResponse } from '@repo/shared';
import { Button } from '../components/Button';
import { FloatingStars } from '../components/FloatingStars';
import { getOrder } from '../services/payment-service';
import { useQuery } from '@tanstack/react-query';

interface OrderPageLocationState {
  paymentData?: OrderResponse;
}

const getStatusMessage = (
  paymentData?: OrderResponse,
  orderStatus?: string,
) => {
  if (
    paymentData?.status_detail === 'accredited' ||
    orderStatus === 'APPROVED'
  ) {
    return {
      icon: CheckCircle2,
      label: 'Pagamento aprovado!',
      description: 'Recebemos a confirmação do pagamento deste pedido.',
      className: 'bg-green-50 text-green-800',
    };
  }

  if (paymentData?.status_detail === 'waiting_transfer') {
    return {
      icon: Clock,
      label: 'Aguardando pagamento via PIX',
      description: 'Escaneie o QR Code ou use o copia e cola para pagar.',
      className: 'bg-yellow-50 text-yellow-800',
    };
  }

  return {
    icon: Clock,
    label: 'Pagamento em análise',
    description: 'Estamos aguardando a atualização do provedor de pagamento.',
    className: 'bg-purple-50 text-purple-800',
  };
};

export function OrderPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const [hasCopiedPixCode, setHasCopiedPixCode] = useState(false);
  const locationState = location.state as OrderPageLocationState | null;

  const query = useQuery<GetOrderRes | undefined>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return undefined;
      return getOrder(orderId);
    },
    enabled: Boolean(orderId),
    placeholderData: locationState?.paymentData
      ? { mpOrder: locationState.paymentData }
      : undefined,
  });

  const { data: orderData, isLoading, error } = query;

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        Carregando pedido...
      </div>
    );
  }

  if ((!orderData?.order && !orderData?.mpOrder) || error) {
    return <Navigate to='/cart' replace />;
  }

  const { order, mpOrder: paymentData } = orderData;
  const paymentMethod =
    paymentData?.transactions?.payments?.[0]?.payment_method;
  const qrBase64 = paymentMethod?.qr_code_base64;
  const qrString = paymentMethod?.qr_code;
  const qrImgSrc = qrBase64 ? `data:image/png;base64,${qrBase64}` : undefined;
  const statusMessage = getStatusMessage(paymentData, order?.status);
  const StatusIcon = statusMessage.icon;
  const orderItems = order?.items ?? [];
  const totalQuantity = orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const totalAmount = Number(order?.totalAmount ?? 0);

  const handleCopyPixCode = async () => {
    if (!qrString) return;

    await window.navigator.clipboard.writeText(qrString);
    setHasCopiedPixCode(true);
  };

  return (
    <div className='min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 overflow-x-hidden'>
      <FloatingStars />
      <div className='absolute inset-0 opacity-30 pointer-events-none'>
        <div className='absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full blur-2xl animate-pulse' />
        <div className='absolute top-1/3 right-20 w-32 h-32 bg-pink-300 rounded-full blur-3xl animate-pulse delay-100' />
        <div className='absolute bottom-20 left-1/4 w-24 h-24 bg-purple-300 rounded-full blur-2xl animate-pulse delay-200' />
      </div>

      <div className='relative z-10'>
        <header className='py-6 px-4 md:px-8'>
          <nav className='max-w-7xl mx-auto flex items-center justify-between'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className='flex items-center gap-2'
            >
              <Sparkles className='w-8 h-8 text-purple-600' />
              <span className='text-xl md:text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                Magna Escrita
              </span>
            </motion.div>

            <Link
              to='/'
              className='flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all'
            >
              <Home className='w-5 h-5 text-purple-600' />
              <span className='hidden md:inline'>Início</span>
            </Link>
          </nav>
        </header>

        <main className='max-w-4xl mx-auto px-4 py-6 md:py-10'>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-8 text-center'
          >
            <h1 className='text-4xl md:text-5xl lg:text-6xl mb-4 bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent'>
              Seu pedido
            </h1>
            <p className='text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed'>
              Acompanhe aqui.
            </p>
            <div className='mt-5 rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-800 w-fit m-auto'>
              Pedido: {order?.id}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white/90 backdrop-blur rounded-2xl shadow-md border border-purple-100 p-4 md:p-6'
          >
            <div
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 ${statusMessage.className}`}
            >
              <StatusIcon className='w-5 h-5' />
              <span className='font-semibold'>{statusMessage.label}</span>
            </div>

            <p className='mt-4 text-gray-600'>{statusMessage.description}</p>

            {qrImgSrc && (
              <div className='mt-6 text-center'>
                <div className='text-lg font-semibold text-gray-800 mb-4'>
                  QR Code PIX
                </div>
                <img
                  src={qrImgSrc}
                  alt='QR Code PIX'
                  className='mx-auto mb-4 w-full max-w-60 rounded-xl border border-purple-100 bg-white p-3'
                />
              </div>
            )}

            {qrString && (
              <div className='mt-5 space-y-3'>
                <label
                  className='block text-sm font-semibold text-gray-700'
                  htmlFor='pix-copy-code'
                >
                  PIX copia e cola
                </label>
                <div
                  id='pix-copy-code'
                  className='wrap-break-word w-full rounded-xl border border-purple-100 bg-white p-3 text-sm text-gray-700'
                >
                  {qrString}
                </div>
                <Button onClick={handleCopyPixCode} className='w-full'>
                  {hasCopiedPixCode ? (
                    <Check className='w-5 h-5' />
                  ) : (
                    <Clipboard className='w-5 h-5' />
                  )}
                  {hasCopiedPixCode ? 'Código copiado' : 'Copiar código PIX'}
                </Button>
              </div>
            )}
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {orderItems.length > 0 && (
              <div className='mt-6 rounded-xl border border-purple-100 bg-white/80 p-6'>
                <div className='flex items-center justify-between gap-4 border-b border-purple-100 pb-6'>
                  <div className='flex items-center gap-2'>
                    <ShoppingBag className='w-5 h-5 text-purple-600' />
                    <h2 className='text-xl font-semibold text-gray-800'>
                      Produtos do pedido
                    </h2>
                  </div>
                  <span className='text-sm text-gray-500'>
                    {totalQuantity} item(s)
                  </span>
                </div>

                <div className='divide-y divide-purple-100'>
                  {orderItems.map((item) => {
                    const unitAmount = Number(item.amount);
                    const lineTotal = unitAmount * item.quantity;

                    return (
                      <div
                        key={item.bookId}
                        className='flex items-start justify-between gap-4 py-4'
                      >
                        <div className='flex min-w-0 items-start gap-3'>
                          <div className='w-11 h-14 shrink-0 rounded-lg bg-linear-to-br from-purple-100 via-pink-100 to-indigo-100 shadow-inner flex items-center justify-center'>
                            <BookOpen className='w-5 h-5 text-purple-500' />
                          </div>

                          <div className='min-w-0'>
                            <h3 className='text-sm font-semibold text-gray-800'>
                              {item.book.title}
                            </h3>
                            <p className='mt-1 text-xs text-gray-500'>
                              {item.book.author}
                            </p>
                            <p className='mt-2 text-xs text-gray-600'>
                              {item.quantity} x R$ {unitAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className='shrink-0 text-right text-sm font-semibold text-purple-700'>
                          R$ {lineTotal.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className='pt-4 border-t border-purple-100 flex items-center justify-between text-lg font-semibold text-gray-800'>
                  <span>Total</span>
                  <span className='text-purple-700'>
                    R$ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </motion.aside>
        </main>
      </div>
    </div>
  );
}
