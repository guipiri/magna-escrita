import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
}: ButtonProps) {
  const baseClasses =
    'rounded-full transition-all duration-200 flex items-center gap-2 justify-center';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg hover:shadow-xl active:scale-95',
    secondary:
      'bg-white text-purple-600 shadow-md hover:shadow-lg hover:bg-purple-50 active:scale-95',
  };

  const sizeClasses = {
    sm: 'px-6 py-2',
    md: 'px-8 py-3',
    lg: 'px-10 py-4',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ border: '0' }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
