import { useMemo } from 'react';

interface StarConfig {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  hue: number;
}

export function FloatingStars() {
  const stars = useMemo<StarConfig[]>(() => {
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 14 + Math.random() * 8,
      duration: 4 + Math.random() * 4,
      hue: Math.floor(Math.random() * 60 + 280),
    }));
  }, []);

  return (
    <div className='fixed inset-0 pointer-events-none overflow-hidden z-0'>
      {stars.map((star) => (
        <div
          key={star.id}
          className='absolute animate-float-star will-change-transform'
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDuration: `${star.duration}s`,
            animationDelay: '0s',
          }}
        >
          <svg
            width={star.size}
            height={star.size}
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M10 0L12.2451 6.90983L19.5106 7.75532L14.0901 12.3402L15.8779 19.2447L10 15.2L4.12215 19.2447L5.90983 12.3402L0.489435 7.75532L7.75486 6.90983L10 0Z'
              fill={`hsl(${star.hue}, 70%, 70%)`}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
