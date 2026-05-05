import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/Button';
import { useCart } from '../context/cart-context';
import { useAuth } from '../context/auth-context';
import {
  BookOpen,
  CreditCard,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleLogin } from '@react-oauth/google';

export function CartPage() {
  const navigate = useNavigate();
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const {
    items,
    totalQuantity,
    subtotal,
    checkoutDisabledReason,
    increaseBook,
    decreaseBook,
    removeBook,
    clearCart,
  } = useCart();
  const { user, isLoading: isAuthLoading, error, loginWithGoogle } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [localAuthError, setLocalAuthError] = useState<string | null>(null);

  const hasItems = items.length > 0;
  const checkoutBlocked = Boolean(checkoutDisabledReason);

  const handleFinalizePurchase = () => {
    if (checkoutBlocked) {
      return;
    }

    if (user) {
      navigate('/checkout');
      return;
    }

    setShowLogin(true);

    if (!googleEnabled) {
      setLocalAuthError('Login Google indisponivel.');
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    try {
      setLocalAuthError(null);
      await loginWithGoogle(idToken);
      navigate('/checkout');
    } catch {
      setLocalAuthError('Nao foi possivel autenticar com o Google.');
    }
  };

  return (
    <main className='max-w-7xl mx-auto px-4 py-6 md:py-10'>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='mb-8 text-center'
      >
        <div className='inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-5'>
          <Heart className='w-4 h-4 text-purple-600 fill-purple-600' />
          <span className='text-sm text-purple-700'>
            Livros escolhidos com carinho
          </span>
        </div>
        <h1 className='text-4xl md:text-5xl lg:text-6xl mb-4 bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent'>
          Seu Carrinho
        </h1>
        <p className='text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed'>
          Revise os títulos selecionados, ajuste as quantidades e finalize seu
          pedido quando tudo estiver pronto.
        </p>
      </motion.section>

      {!hasItems ? (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='max-w-2xl mx-auto bg-white/90 backdrop-blur rounded-2xl shadow-md border border-purple-100 p-8 md:p-10 text-center'
        >
          <div className='w-16 h-16 mx-auto mb-5 rounded-full bg-purple-100 flex items-center justify-center'>
            <ShoppingBag className='w-8 h-8 text-purple-600' />
          </div>
          <h2 className='text-2xl md:text-3xl font-semibold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3'>
            Seu carrinho está vazio
          </h2>
          <p className='text-gray-600 mb-6'>
            Escolha um livro para guardar esse pedacinho de imaginação no seu
            pedido.
          </p>
          <Link to='/' className='inline-flex'>
            <Button size='lg'>
              <BookOpen className='w-5 h-5' />
              Ver livro
            </Button>
          </Link>
        </motion.section>
      ) : (
        <div className='grid lg:grid-cols-[1fr_380px] gap-6 items-start'>
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white/90 backdrop-blur rounded-2xl shadow-md border border-purple-100 p-4 md:p-6'
          >
            <div className='flex items-center justify-between gap-4 pb-4 border-b border-purple-100'>
              <div>
                <h2 className='text-2xl font-semibold text-gray-800'>
                  Livros selecionados
                </h2>
                <p className='text-sm text-gray-500 mt-1'>
                  {totalQuantity} item(s) no pedido
                </p>
              </div>

              <button
                onClick={clearCart}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all'
              >
                <Trash2 className='w-4 h-4' />
                <span className='hidden sm:inline'>Limpar</span>
              </button>
            </div>

            <div className='divide-y divide-purple-100'>
              {items.map((item) => {
                return (
                  <div
                    key={item.bookId}
                    className='flex flex-col md:flex-row md:items-center justify-between gap-5 py-5'
                  >
                    <div className='flex items-start gap-4'>
                      <div className='w-16 h-20 shrink-0 rounded-lg bg-linear-to-br from-purple-100 via-pink-100 to-indigo-100 shadow-inner flex items-center justify-center'>
                        <BookOpen className='w-7 h-7 text-purple-500' />
                      </div>

                      <div>
                        <h3 className='text-lg font-semibold text-gray-800'>
                          {item.title}
                        </h3>
                        <p className='text-sm text-gray-500 mt-1'>
                          {item.author}
                        </p>
                        <p className='text-sm text-gray-600 mt-3'>
                          {item.isAvailable
                            ? `R$ ${item.price.toFixed(2)} cada`
                            : 'Remova este item para continuar.'}
                        </p>
                      </div>
                    </div>

                    <div className='flex flex-wrap items-center justify-between md:justify-end gap-4'>
                      <div className='flex items-center gap-2 rounded-full bg-purple-50 p-1'>
                        <button
                          onClick={() => decreaseBook(item.bookId)}
                          className='w-9 h-9 rounded-full bg-white text-purple-600 shadow-sm hover:shadow-md transition-all flex items-center justify-center'
                          aria-label={`Diminuir quantidade de ${item.title}`}
                        >
                          <Minus className='w-4 h-4' />
                        </button>
                        <span className='w-8 text-center font-semibold text-purple-700'>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseBook(item.bookId)}
                          className='w-9 h-9 rounded-full bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center'
                          aria-label={`Aumentar quantidade de ${item.title}`}
                        >
                          <Plus className='w-4 h-4' />
                        </button>
                      </div>

                      <div className='min-w-24 text-right'>
                        <div className='text-lg font-semibold text-purple-700'>
                          {item.isAvailable
                            ? `R$ ${item.lineTotal.toFixed(2)}`
                            : '--'}
                        </div>
                        <button
                          onClick={() => removeBook(item.bookId)}
                          className='text-sm text-gray-500 hover:text-pink-600 transition-colors'
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white/90 backdrop-blur rounded-2xl shadow-md border border-purple-100 p-6 lg:sticky lg:top-6'
          >
            <div className='flex items-center gap-2 mb-5'>
              <Sparkles className='w-5 h-5 text-purple-600' />
              <h2 className='text-2xl font-semibold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                Resumo
              </h2>
            </div>

            <div className='space-y-3 text-gray-600'>
              <div className='flex items-center justify-between'>
                <span>Itens</span>
                <span>{totalQuantity}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className='pt-3 border-t border-purple-100 flex items-center justify-between text-lg font-semibold text-gray-800'>
                <span>Total</span>
                <span className='text-purple-700'>
                  R$ {subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className='mt-6 flex flex-col gap-3'>
              {checkoutDisabledReason && (
                <div className='rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800'>
                  {checkoutDisabledReason}
                </div>
              )}

              <Button className='w-full' onClick={handleFinalizePurchase}>
                <CreditCard className='w-5 h-5' />
                Finalizar compra
              </Button>

              {showLogin && !user ? (
                <div className='rounded-2xl border border-purple-100 bg-white/80 px-4 py-4 text-sm text-gray-600'>
                  <p className='text-sm text-gray-600 mb-3'>
                    Para finalizar a compra, entre com Google.
                  </p>
                  {googleEnabled ? (
                    <GoogleLogin
                      onSuccess={(credentialResponse) => {
                        const credential = credentialResponse.credential;
                        if (credential) {
                          void handleGoogleLogin(credential);
                        }
                      }}
                      onError={() => {
                        setLocalAuthError('Falha ao autenticar com o Google.');
                      }}
                      useOneTap
                    />
                  ) : null}
                  {(error || localAuthError) && (
                    <p className='mt-2 text-xs text-red-600'>
                      {error ?? localAuthError}
                    </p>
                  )}
                  {isAuthLoading ? (
                    <p className='mt-2 text-xs text-gray-500'>
                      Autenticando...
                    </p>
                  ) : null}
                </div>
              ) : null}

              <Link to='/'>
                <Button variant='secondary' className='w-full'>
                  <BookOpen className='w-5 h-5' />
                  Adicionar mais livros
                </Button>
              </Link>
            </div>
          </motion.aside>
        </div>
      )}
    </main>
  );
}
