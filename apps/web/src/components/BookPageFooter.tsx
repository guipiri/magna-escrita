import { Sparkles } from 'lucide-react';

export const BookPageFooter = () => {
  return (
    <footer className='py-12 px-4 mt-12 border-t border-purple-100'>
      <div className='max-w-7xl mx-auto text-center'>
        <div className='flex items-center justify-center gap-2 mb-4'>
          <Sparkles className='w-6 h-6 text-purple-600' />
          <span className='text-xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
            Magna Escrita
          </span>
        </div>
        <p className='text-gray-600'>
          Transformando a imaginação das crianças em livros reais
        </p>
      </div>
    </footer>
  );
};
