import { Outlet } from 'react-router-dom';
import { BookPageFooter } from '../components/BookPageFooter';
import { FloatingStars } from '../components/FloatingStars';
import { StoreHeader } from '../components/StoreHeader';

export function StoreLayout() {
  return (
    <div className='min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 overflow-x-hidden'>
      <FloatingStars />
      <div className='absolute inset-0 opacity-30 pointer-events-none'>
        <div className='absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full blur-2xl animate-pulse' />
        <div className='absolute top-1/3 right-20 w-32 h-32 bg-pink-300 rounded-full blur-3xl animate-pulse delay-100' />
        <div className='absolute bottom-20 left-1/4 w-24 h-24 bg-purple-300 rounded-full blur-2xl animate-pulse delay-200' />
      </div>
      <div className='relative z-10'>
        <StoreHeader />
        <Outlet />
        <BookPageFooter />
      </div>
    </div>
  );
}
