import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import { BookViewer } from '../components/BookViewer';
import { Button } from '../components/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { getBookByMagnificCode } from '../services/book-service';
import { useCart } from '../context/cart-context';
import { useQuery } from '@tanstack/react-query';
import { routes } from '../main';

export function ReadBookPage() {
  const navigate = useNavigate();
  const { magnificCode } = useParams();
  const { addBook } = useCart();

  if (!magnificCode) return null;

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', magnificCode],
    queryFn: () => getBookByMagnificCode(magnificCode),
    enabled: Boolean(magnificCode),
    retry: 1,
  });

  if (isLoading) return <p className='px-4 py-12 text-center'>Carregando...</p>;

  if (!book) return <p>Livro não encontrado...</p>;

  const handleAddToCart = () => {
    if (!book) return;

    addBook(book.id);
  };

  return (
    <main>
      <section className='px-4 overflow-hidden'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-4 text-center'
          >
            <button
              onClick={() => navigate(routes.BOOK.pathGenerator(book.magnificCode))}
              className='inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all mb-4'
            >
              ← Voltar para a capa
            </button>
            <h2 className='text-3xl md:text-4xl bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
              {book.title}
            </h2>
            <p className='text-gray-600 mt-2'>por {book.author}</p>
          </motion.div>

          <BookViewer pages={book.pages} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className='mt-12 text-center'
          >
            <p className='text-gray-600 mb-6'>Gostou da história?</p>
            <Button size='lg' onClick={handleAddToCart}>
              <ShoppingCart className='w-5 h-5' />
              Adicionar ao Carrinho
            </Button>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
