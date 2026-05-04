import { motion } from 'motion/react';
import { ImageWithFallback } from './ImageWithFallback';

interface BookCoverProps {
  title: string;
  author: string;
  coverImage: string;
}

export function BookCover({ title, author, coverImage }: BookCoverProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className='relative'
    >
      <div className='relative w-full max-w-sm mx-auto'>
        <div className='relative bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-300'>
          <div className='aspect-square relative'>
            <ImageWithFallback
              src={coverImage}
              alt={`Capa do livro ${title}`}
              className='w-full h-full object-cover'
            />
          </div>
          <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/20' />
        </div>
        <div className='absolute -bottom-2 -right-2 w-full h-full bg-linear-to-br from-pink-200 to-purple-200 rounded-2xl -z-10 transform rotate-1' />
        <div className='absolute -bottom-4 -right-4 w-full h-full bg-linear-to-br from-yellow-100 to-pink-100 rounded-2xl -z-20 transform -rotate-1' />
        <div className='mt-4 text-center'>
          <div className='text-sm text-gray-600'>por {author}</div>
        </div>
      </div>
    </motion.div>
  );
}
