import { useEffect, useId, useRef, useState } from 'react';
import { Link, useMatch, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Home, LogIn, ShoppingCart, Sparkles } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useCart } from '../context/cart-context';
import { useGoogleLogin } from '@react-oauth/google';

export function StoreHeader() {
  const navigate = useNavigate();
  const { user, logout, loginWithGoogle } = useAuth();
  const handleLoginWithGoogle = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: (coderesponse) => loginWithGoogle({ code: coderesponse.code }),
  });
  const { totalQuantity } = useCart();
  const isBookRoute = Boolean(useMatch('/book/:magnificCode'));
  const isCartRoute = Boolean(useMatch('/cart'));
  const isCheckoutRoute = Boolean(useMatch('/checkout'));
  const isOrderRoute = Boolean(useMatch('/order/:orderId'));
  const isOrdersRoute = Boolean(useMatch('/orders'));
  const isHomeRoute = Boolean(useMatch('/'));
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuId = useId();

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!userMenuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const userBadge = user ? (
    <div className='relative' ref={userMenuRef}>
      <button
        type='button'
        aria-haspopup='menu'
        aria-expanded={isUserMenuOpen}
        aria-controls={userMenuId}
        onClick={() => setIsUserMenuOpen((prev) => !prev)}
        className='flex items-center gap-2'
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name ?? 'Usuario'}
            className='w-9 h-9 rounded-full border border-white shadow'
          />
        ) : (
          <div className='w-9 h-9 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center'>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </button>
      {isUserMenuOpen ? (
        <div
          id={userMenuId}
          role='menu'
          className='absolute right-0 mt-2 w-44 rounded-2xl border border-purple-100 bg-white/95 shadow-xl backdrop-blur p-2 z-20'
        >
          <button
            type='button'
            role='menuitem'
            onClick={() => {
              setIsUserMenuOpen(false);
              navigate('/orders');
            }}
            className='w-full px-3 py-2 text-sm text-left rounded-xl hover:bg-purple-50 text-purple-700'
          >
            Pedidos
          </button>
          <button
            type='button'
            role='menuitem'
            onClick={() => {
              setIsUserMenuOpen(false);
              void logout();
            }}
            className='w-full px-3 py-2 text-sm text-left rounded-xl hover:bg-purple-50 text-purple-700'
          >
            Sair
          </button>
        </div>
      ) : null}
    </div>
  ) : (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className='flex items-center gap-2 px-4 py-2 bg-white shadow-md hover:shadow-lg transition-all'
      onClick={() => handleLoginWithGoogle()}
    >
      <LogIn className='w-5 h-5 text-purple-600' />
    </motion.button>
  );

  const renderActions = () => {
    if (isBookRoute || isHomeRoute) {
      return (
        <div className='flex items-center gap-3'>
          {userBadge}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/cart')}
            className='flex items-center gap-2 px-4 py-2 bg-white shadow-md hover:shadow-lg transition-all'
            type='button'
          >
            <ShoppingCart className='w-5 h-5 text-purple-600' />
            <span className='hidden md:inline'>Carrinho</span>
            {totalQuantity > 0 ? (
              <span className='min-w-5 h-5 px-1.5 rounded-full bg-purple-600 text-white text-xs font-semibold inline-flex items-center justify-center'>
                {totalQuantity}
              </span>
            ) : null}
          </motion.button>
        </div>
      );
    }

    if (isCartRoute) {
      return (
        <div className='flex items-center gap-3'>
          {userBadge}
          <button
            onClick={() => navigate(-1)}
            className='flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all'
            type='button'
          >
            <ArrowLeft className='w-5 h-5 text-purple-600' />
            <span className='hidden md:inline'>Voltar ao livro</span>
          </button>
        </div>
      );
    }

    if (isCheckoutRoute) {
      return (
        <div className='flex items-center gap-3'>
          {userBadge}
          <button
            onClick={() => navigate('/cart')}
            className='flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all'
            type='button'
          >
            <ArrowLeft className='w-5 h-5 text-purple-600' />
            <span className='hidden md:inline'>Voltar ao carrinho</span>
          </button>
        </div>
      );
    }

    if (isOrderRoute || isOrdersRoute) {
      return (
        <div className='flex items-center gap-3'>
          {userBadge}
          <Link
            to='/'
            className='flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all'
          >
            <Home className='w-5 h-5 text-purple-600' />
            <span className='hidden md:inline'>Inicio</span>
          </Link>
        </div>
      );
    }

    return null;
  };

  return (
    <header className='py-6 px-4 md:px-8'>
      <nav className='max-w-7xl mx-auto flex items-center justify-between'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            to='/'
            className='flex items-center gap-2 text-xl md:text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
          >
            <Sparkles className='w-8 h-8 text-purple-600' />
            Magna Escrita
          </Link>
        </motion.div>
        {renderActions()}
      </nav>
    </header>
  );
}
