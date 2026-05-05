import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  CreditCard,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/Button';
import { FloatingStars } from '../components/FloatingStars';
import { MercadoPagoCheckout } from '../components/MercadoPagoCheckout';
import { useCart } from '../context/cart-context';
import { CartPage } from './CartPage';

export function CheckoutPage() {
  const navigate = useNavigate();
  const {
    items,
    totalQuantity,
    subtotal,
    checkoutDisabledReason,
    isLoadingBookDetails,
    clearCart,
  } = useCart();

  const handlePaymentSuccess = (orderId: string | undefined) => {
    navigate(`/order/${orderId}`);
    clearCart();
  };

  if (isLoadingBookDetails) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-pink-50 via-purple-50 to-blue-50'>
        <FloatingStars />
        <div className='absolute inset-0 opacity-30 pointer-events-none'>
          <div className='absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full blur-2xl animate-pulse' />
          <div className='absolute top-1/3 right-20 w-32 h-32 bg-pink-300 rounded-full blur-3xl animate-pulse delay-100' />
          <div className='absolute bottom-20 left-1/4 w-24 h-24 bg-purple-300 rounded-full blur-2xl animate-pulse delay-200' />
        </div>

        <div className='relative z-10 rounded-xl bg-purple-50 p-5 text-purple-800'>
          Preparando os dados do pedido antes do pagamento.
        </div>
      </div>
    );
  }

  if (checkoutDisabledReason) {
    return <Navigate to='/cart' replace />;
  }

  if (!items.length) {
    return <CartPage />;
  }

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

            <button
              onClick={() => navigate('/cart')}
              className='flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all'
            >
              <ArrowLeft className='w-5 h-5 text-purple-600' />
              <span className='hidden md:inline'>Voltar ao carrinho</span>
            </button>
          </nav>
        </header>

        <main className='max-w-7xl mx-auto px-4 py-6 md:py-10'>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-8 text-center'
          >
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-5'>
              <CreditCard className='w-4 h-4 text-purple-600' />
              <span className='text-sm text-purple-700'>
                Finalização segura do pedido
              </span>
            </div>
            <h1 className='text-4xl md:text-5xl lg:text-6xl mb-4 bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent'>
              Já é quase seu...
            </h1>
            <p className='text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed'>
              Escolha a forma de pagamento e conclua a compra dos livros
              selecionados.
            </p>
          </motion.section>

          <div className='grid lg:grid-cols-[1fr_380px] gap-6 items-start'>
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`order-2 lg:order-1 bg-white/90 backdrop-blur rounded-2xl shadow-md border border-purple-100 p-2 md:pt-0`}
            >
              {isLoadingBookDetails ? (
                <div className='rounded-xl bg-purple-50 p-5 text-purple-800'>
                  Preparando os dados do pedido antes do pagamento.
                </div>
              ) : (
                <MercadoPagoCheckout
                  items={items}
                  totalAmount={subtotal}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='order-1 lg:order-2 bg-white/90 backdrop-blur rounded-2xl shadow-md border border-purple-100 p-6 lg:sticky lg:top-6'
            >
              <div className='flex items-center gap-2 mb-5'>
                <ShoppingBag className='w-5 h-5 text-purple-600' />
                <h2 className='text-2xl font-semibold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                  Pedido
                </h2>
              </div>

              <div className='space-y-4'>
                <div className='space-y-3 text-gray-600'>
                  <div className='flex items-center justify-between'>
                    <span>Itens</span>
                    <span>{totalQuantity}</span>
                  </div>
                  <div className='pt-3 border-t border-purple-100 flex items-center justify-between text-lg font-semibold text-gray-800'>
                    <span>Total</span>
                    <span className='text-purple-700'>
                      R$ {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className='divide-y divide-purple-100 rounded-xl border border-purple-100 overflow-hidden'>
                  {items.map((item) => (
                    <div
                      key={item.bookId}
                      className='flex items-start gap-3 bg-white/70 p-3'
                    >
                      <div className='w-11 h-14 shrink-0 rounded-lg bg-linear-to-br from-purple-100 via-pink-100 to-indigo-100 shadow-inner flex items-center justify-center'>
                        <BookOpen className='w-5 h-5 text-purple-500' />
                      </div>

                      <div className='min-w-0 flex-1'>
                        <h3 className='text-sm font-semibold text-gray-800'>
                          {item.title}
                        </h3>
                        <p className='mt-1 text-xs text-gray-500'>
                          {item.quantity} x R$ {item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link to='/cart' className='block'>
                  <Button variant='secondary' className='w-full'>
                    <ArrowLeft className='w-5 h-5' />
                    Editar carrinho
                  </Button>
                </Link>
              </div>
            </motion.aside>
          </div>
        </main>
      </div>
    </div>
  );
}
