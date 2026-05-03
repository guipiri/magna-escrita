import { motion } from 'motion/react';

export function FloatingStars() {
  const stars = Array.from({ length: 20 });

  return (
    <div className='fixed inset-0 pointer-events-none overflow-hidden z-0'>
      {stars.map((_, i) => (
        <motion.div
          key={i}
          className='absolute'
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: 0,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        >
          <svg
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M10 0L12.2451 6.90983L19.5106 7.75532L14.0901 12.3402L15.8779 19.2447L10 15.2L4.12215 19.2447L5.90983 12.3402L0.489435 7.75532L7.75486 6.90983L10 0Z'
              fill={`hsl(${Math.random() * 60 + 280}, 70%, 70%)`}
              opacity='0.4'
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
