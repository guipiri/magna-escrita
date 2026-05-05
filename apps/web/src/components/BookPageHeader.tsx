import { ShoppingCart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/auth-context';

interface BookPageHeaderProps {
  cartQuantity: number;
  onCartClick: () => void;
}

export const BookPageHeader = ({
  cartQuantity,
  onCartClick,
}: BookPageHeaderProps) => {
  const { user } = useAuth();

  return (
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
        <div className='flex items-center gap-3'>
          {user ? (
            <div className='flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-md'>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name ?? 'Usuario'}
                  className='w-7 h-7 rounded-full border border-white'
                />
              ) : (
                <div className='w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center'>
                  {(user.name ?? 'ME').slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className='hidden md:inline text-sm text-gray-700'>
                {user.name ?? 'Usuario'}
              </span>
            </div>
          ) : null}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onCartClick}
            className='flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all'
            type='button'
          >
            <ShoppingCart className='w-5 h-5 text-purple-600' />
            <span className='hidden md:inline'>Carrinho</span>
            {cartQuantity > 0 ? (
              <span className='min-w-5 h-5 px-1.5 rounded-full bg-purple-600 text-white text-xs font-semibold inline-flex items-center justify-center'>
                {cartQuantity}
              </span>
            ) : null}
          </motion.button>
        </div>
      </nav>
    </header>
  );
};
