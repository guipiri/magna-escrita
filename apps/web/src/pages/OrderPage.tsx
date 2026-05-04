import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Check,
  CheckCircle2,
  Clipboard,
  Clock,
  Home,
  Sparkles,
} from 'lucide-react';
import { OrderResponse } from '@repo/shared';
import { Button } from '../components/Button';
import { FloatingStars } from '../components/FloatingStars';

const PAYMENT_RESULT_STORAGE_KEY_PREFIX = 'magna-escrita-payment-result:';

interface OrderPageLocationState {
  paymentData?: OrderResponse;
}

const readStoredPaymentData = (orderId: string | undefined) => {
  if (!orderId || typeof window === 'undefined') {
    return undefined;
  }

  try {
    const storedPaymentData = window.localStorage.getItem(
      `${PAYMENT_RESULT_STORAGE_KEY_PREFIX}${orderId}`,
    );

    if (!storedPaymentData) {
      return undefined;
    }

    return JSON.parse(storedPaymentData) as OrderResponse;
  } catch {
    return undefined;
  }
};

const getStatusMessage = (paymentData: OrderResponse) => {
  if (paymentData.status_detail === 'accredited') {
    return {
      icon: CheckCircle2,
      label: 'Pagamento aprovado!',
      description: 'Recebemos a confirmação do pagamento deste pedido.',
      className: 'bg-green-50 text-green-800',
    };
  }

  if (paymentData.status_detail === 'waiting_transfer') {
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
  const paymentData = useMemo(
    () => locationState?.paymentData || readStoredPaymentData(orderId),
    [locationState?.paymentData, orderId],
  );

  if (!paymentData) {
    return <Navigate to='/cart' replace />;
  }

  const paymentMethod = paymentData.transactions?.payments?.[0]?.payment_method;
  const qrBase64 = paymentMethod?.qr_code_base64;
  const qrString = paymentMethod?.qr_code;
  const qrImgSrc = qrBase64 ? `data:image/png;base64,${qrBase64}` : undefined;
  const statusMessage = getStatusMessage(paymentData);
  const StatusIcon = statusMessage.icon;

  const handleCopyPixCode = async () => {
    if (!qrString) {
      return;
    }

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
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-5'>
              <StatusIcon className='w-4 h-4 text-purple-600' />
              <span className='text-sm text-purple-700'>Pedido criado</span>
            </div>
            <h1 className='text-4xl md:text-5xl lg:text-6xl mb-4 bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent'>
              Seu pedido
            </h1>
            <p className='text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed'>
              Acompanhe o status do pagamento e conclua o PIX quando disponível.
            </p>
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

            <div className='mt-5 rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-800'>
              Pedido: {orderId || paymentData.id}
            </div>

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
        </main>
      </div>
    </div>
  );
}
