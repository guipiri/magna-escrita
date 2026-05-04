import { useState } from 'react';
import { BookCover } from '../components/BookCover';
import { BookViewer } from '../components/BookViewer';
import { Button } from '../components/Button';
import { FloatingStars } from '../components/FloatingStars';
import { Confetti } from '../components/Confetti';
import { ShoppingCart, Sparkles, Heart } from 'lucide-react';
import { motion } from 'motion/react';

const bookData = {
  title: 'As Aventuras Mágicas de Sofia',
  author: 'Sofia Maria, 7 anos',
  coverImage:
    'https://images.unsplash.com/photo-1627229045047-b53784b1c121?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  synopsis:
    'Uma história encantadora sobre uma menina que descobre um mundo mágico cheio de cores, amizade e aventuras incríveis. Escrito e ilustrado com todo o carinho por uma jovem autora.',
};

export default function BookPage() {
  const [showBook, setShowBook] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  return (
    <div className='min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 overflow-x-hidden'>
      <Confetti trigger={showConfetti} />
      <FloatingStars />
      <div className='absolute inset-0 opacity-30 pointer-events-none'>
        <div className='absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full blur-2xl animate-pulse' />
        <div className='absolute top-1/3 right-20 w-32 h-32 bg-pink-300 rounded-full blur-3xl animate-pulse delay-100' />
        <div className='absolute bottom-20 left-1/4 w-24 h-24 bg-purple-300 rounded-full blur-2xl animate-pulse delay-200' />
      </div>

      <div className='relative z-10'>
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
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all'
            >
              <ShoppingCart className='w-5 h-5 text-purple-600' />
              <span className='hidden md:inline'>Carrinho</span>
            </motion.button>
          </nav>
        </header>

        {!showBook ? (
          <section className='p-8'>
            <div className='max-w-7xl mx-auto'>
              <div className='grid md:grid-cols-2 gap-12 items-center'>
                <div className='order-2 md:order-1'>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className='inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6'>
                      <Heart className='w-4 h-4 text-purple-600 fill-purple-600' />
                      <span className='text-sm text-purple-700'>
                        Criado por uma criança magnífica
                      </span>
                    </div>

                    <h1 className='text-4xl md:text-5xl lg:text-6xl mb-4 bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent'>
                      {bookData.title}
                    </h1>

                    <p className='text-xl md:text-2xl text-gray-600 mb-6'>
                      por {bookData.author}
                    </p>

                    <p className='text-lg text-gray-700 leading-relaxed mb-4'>
                      {bookData.synopsis}
                    </p>

                    <div className='flex flex-col sm:flex-row gap-4 mt-10 '>
                      <Button
                        onClick={() => {
                          setShowBook(true);
                          setShowConfetti(true);
                          setTimeout(() => setShowConfetti(false), 100);
                        }}
                        size='lg'
                      >
                        <Sparkles className='w-5 h-5' />
                        Ler o Livro
                      </Button>
                      <Button variant='secondary' size='lg'>
                        <ShoppingCart className='w-5 h-5' />
                        Adicionar ao Carrinho
                      </Button>
                    </div>

                    <div className='mt-8 flex gap-6 text-sm text-gray-600'>
                      <div>
                        <span className='block font-semibold text-purple-600'>
                          6 páginas
                        </span>
                        <span>de pura magia</span>
                      </div>
                      <div className='border-l border-gray-300 pl-6'>
                        <span className='block font-semibold text-purple-600'>
                          100%
                        </span>
                        <span>autoria infantil</span>
                      </div>
                      <div className='border-l border-gray-300 pl-6'>
                        <span className='block font-semibold text-purple-600'>
                          Único
                        </span>
                        <span>no mundo</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className='order-1 md:order-2'>
                  <BookCover
                    title={bookData.title}
                    author={bookData.author}
                    coverImage={'/cover.png'}
                  />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className='px-4'>
            <div className='max-w-7xl mx-auto'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='mb-4 text-center'
              >
                <button
                  onClick={() => setShowBook(false)}
                  className='inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all mb-4'
                >
                  ← Voltar para a capa
                </button>
                <h2 className='text-3xl md:text-4xl bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                  {bookData.title}
                </h2>
                <p className='text-gray-600 mt-2'>por {bookData.author}</p>
              </motion.div>

              <BookViewer />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className='mt-12 text-center'
              >
                <p className='text-gray-600 mb-6'>Gostou da história?</p>
                <Button size='lg'>
                  <ShoppingCart className='w-5 h-5' />
                  Adicionar ao Carrinho
                </Button>
              </motion.div>
            </div>
          </section>
        )}

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
      </div>
    </div>
  );
}
