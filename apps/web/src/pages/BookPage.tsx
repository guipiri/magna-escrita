import { BookCover } from '../components/BookCover';
import { Button } from '../components/Button';
import { ShoppingCart, Sparkles, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookByMagnificCode } from '../services/book-service';
import { useCart } from '../context/cart-context';
import { routes } from '../main';

export default function BookPage() {
  const { magnificCode } = useParams();
  const navigate = useNavigate();
  const { addBook } = useCart();

  const {
    data: book,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['book', magnificCode],
    queryFn: () => getBookByMagnificCode(magnificCode ?? ''),
    enabled: Boolean(magnificCode),
    retry: 1,
  });

  const handleAddToCart = () => {
    if (!book) return;

    addBook(book.id);
  };

  if (!magnificCode) return null;

  if (isLoading) {
    return <p className='px-4 py-12 text-center'>Carregando...</p>;
  }

  if (isError) {
    return (
      <main className='px-4 py-12'>
        <div className='max-w-md mx-auto text-center bg-white rounded-2xl shadow-lg p-8'>
          <Sparkles className='w-10 h-10 text-purple-600 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-gray-900 mb-3'>
            Livro não encontrado
          </h1>
          <p className='text-gray-600'>
            Verifique o código magnifico informado e tente novamente.
          </p>
        </div>
      </main>
    );
  }

  if (!book) return <p>Livro não encontrado...</p>;

  return (
    <main>
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
                  {book.title}
                </h1>

                <p className='text-xl md:text-2xl text-gray-600 mb-6'>
                  por {book.author}
                </p>

                <p className='text-lg text-gray-700 leading-relaxed mb-4'>
                  {book.synopsis}
                </p>

                <div className='flex flex-col sm:flex-row gap-4 mt-10 '>
                  <Button
                    onClick={() =>
                      navigate(routes.READ.pathGenerator(book.magnificCode))
                    }
                    size='lg'
                  >
                    <Sparkles className='w-5 h-5' />
                    Ler o Livro
                  </Button>
                  <Button
                    variant='secondary'
                    size='lg'
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className='w-5 h-5' />
                    Adicionar ao Carrinho
                  </Button>
                </div>

                <div className='mt-8 flex gap-6 text-sm text-gray-600'>
                  <div>
                    <span className='block font-semibold text-purple-600'>
                      {book.pages.length} páginas
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
                title={book.title}
                magnificCode={book.magnificCode}
                coverImage={book.pages[0].imageUrl || ''}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
