import { Link } from 'react-router-dom';
import { MercadoPagoCheckout } from '../components/MercadoPagoCheckout';
import { useCart } from '../context/cart-context';
import { BOOKS, findBookById } from '../data/books';
import { Button } from '../components/Button';

export function PaymentExample() {
  const {
    items,
    addBook,
    increaseBook,
    decreaseBook,
    removeBook,
    totalQuantity,
  } = useCart();

  const handlePaymentSuccess = (orderId: string | undefined) => {
    console.log('Pagamento criado com sucesso. Order ID:', orderId);
  };

  const handlePaymentError = (error: Error) => {
    console.error('Erro ao criar pagamento:', error);
  };

  const total = items.reduce((sum, item) => {
    const book = findBookById(item.bookId);

    if (!book) {
      return sum;
    }

    return sum + book.price * item.quantity;
  }, 0);

  return (
    <div className='py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='space-y-6'>
          <div className='p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-600 text-white shadow-2xl'>
            <div className='flex flex-col md:flex-row justify-between items-center gap-6'>
              <div>
                <div className='inline-block mb-2 px-3 py-1 border border-white/30 rounded-full text-sm'>
                  Livraria Magna
                </div>
                <h1 className='text-3xl font-bold'>
                  Monte seu carrinho de livros
                </h1>
                <p className='text-white/90 max-w-xl mt-2'>
                  Adicione, remova e aumente quantidades com um carrinho
                  persistido. Depois siga para a página de carrinho para revisar
                  tudo e pagar.
                </p>
              </div>

              <div className='flex flex-col items-end gap-3'>
                <div className='bg-white/95 text-slate-900 px-3 py-1 rounded-md'>
                  {totalQuantity} item(s) no carrinho
                </div>
                <Link to='/cart'>
                  <Button size='lg'>Ver carrinho</Button>
                </Link>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <div className='bg-green-50 text-green-800 p-3 rounded-md'>
              Carrinho ativo com total estimado de R$ {total.toFixed(2)}.
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {BOOKS.map((book) => {
              const currentItem = items.find((item) => item.bookId === book.id);
              const quantity = currentItem?.quantity ?? 0;

              return (
                <div
                  key={book.id}
                  className='bg-white rounded-xl p-4 shadow-md h-full flex flex-col justify-between'
                >
                  <div className='space-y-2'>
                    <div className='text-sm text-gray-500'>{book.author}</div>
                    <h3 className='text-lg font-semibold'>{book.title}</h3>
                    <p className='text-sm text-gray-600'>{book.description}</p>
                    <div className='text-xl font-bold text-indigo-600'>
                      R$ {book.price.toFixed(2)}
                    </div>
                  </div>

                  <div className='mt-4'>
                    {quantity > 0 ? (
                      <div className='space-y-2'>
                        <div className='bg-green-50 text-green-800 p-2 rounded-md'>
                          {quantity} exemplar{quantity > 1 ? 'es' : ''} no
                          carrinho
                        </div>

                        <div className='flex flex-wrap gap-2 mt-2'>
                          <Button
                            variant='secondary'
                            onClick={() => decreaseBook(book.id)}
                          >
                            -
                          </Button>
                          <Button onClick={() => increaseBook(book.id)}>
                            +
                          </Button>
                          <Button
                            variant='secondary'
                            onClick={() => removeBook(book.id)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addBook(book.id)}
                        className='w-full'
                      >
                        Adicionar ao carrinho
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <MercadoPagoCheckout
            items={items}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </div>
    </div>
  );
}

export default PaymentExample;
