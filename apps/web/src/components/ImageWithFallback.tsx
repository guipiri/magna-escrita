import { useState } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackColor?: string;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackColor = '#e9d5ff',
  className = '',
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ backgroundColor: fallbackColor }}
      >
        <div className='text-center p-4'>
          <svg
            className='w-16 h-16 mx-auto text-purple-300 mb-2'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          <p className='text-sm text-purple-400'>{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div
          className={`animate-pulse ${className}`}
          style={{ backgroundColor: fallbackColor }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'hidden' : ''}`}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        {...props}
      />
    </>
  );
}
