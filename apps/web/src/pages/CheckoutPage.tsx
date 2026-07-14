import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, CreditCard, ShoppingBag } from 'lucide-react';
import { Button } from '../components/Button';
import { MercadoPagoCheckout } from '../components/MercadoPagoCheckout';
import { useCart } from '../context/cart-context';
import { CartPage } from './CartPage';
import { CreateOrderRes } from '@repo/shared';

export function CheckoutPage() {
  const navigate = useNavigate();
  const {
    items,
    totalQuantity,
    subtotal,
    originalSubtotal,
    totalDiscount,
    checkoutDisabledReason,
    isLoadingBookDetails,
    clearCart,
  } = useCart();

  const handlePaymentSuccess = (order: CreateOrderRes) => {
    navigate(`/order/${order.order.id}`);
    clearCart();
  };

  if (isLoadingBookDetails) {
    return (
      <main className='px-4 py-12'>
        <div className='max-w-3xl mx-auto rounded-xl bg-purple-50 p-5 text-purple-800 text-center'>
          Preparando os dados do pedido antes do pagamento.
        </div>
      </main>
    );
  }

  if (checkoutDisabledReason) {
    return <Navigate to='/cart' replace />;
  }

  if (!items.length) {
    return <CartPage />;
  }

  return (
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
              <div className='flex items-center justify-between'>
                <span>Subtotal</span>
                <span>R$ {originalSubtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className='flex items-center justify-between text-green-600 font-medium'>
                  <span>Desconto</span>
                  <span>- R$ {totalDiscount.toFixed(2)}</span>
                </div>
              )}
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
                    <h3 className='text-sm font-semibold text-gray-800 truncate'>
                      {item.title}
                    </h3>
                    {item.studentName && (
                      <p className='text-[10px] text-purple-600 font-medium mt-0.5'>
                        Aluno: {item.studentName}
                      </p>
                    )}
                    <p className='mt-1 text-xs text-gray-500'>
                      {item.quantity} x R$ {item.price.toFixed(2)}
                      {item.discountPerUnit > 0 && (
                        <span className='ml-1 line-through text-gray-400 text-[10px]'>
                          (R$ {item.originalPrice.toFixed(2)})
                        </span>
                      )}
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
  );
}
