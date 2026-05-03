import { Link } from 'react-router-dom';
import { MercadoPagoCheckout } from '../components/MercadoPagoCheckout';
import { Button } from '../components/Button';
import { findBookById } from '../data/books';
import { useCart } from '../context/cart-context';

export function CartPage() {
  const {
    items,
    totalQuantity,
    increaseBook,
    decreaseBook,
    removeBook,
    clearCart,
  } = useCart();

  const subtotal = items.reduce((sum, item) => {
    const book = findBookById(item.bookId);

    if (!book) {
      return sum;
    }

    return sum + book.price * item.quantity;
  }, 0);

  const hasItems = items.length > 0;

  return (
    <div className='py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='space-y-6'>
          <div className='p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-sky-600 text-white'>
            <div className='flex flex-col md:flex-row justify-between items-center gap-6'>
              <div>
                <div className='uppercase text-sm opacity-80'>Carrinho</div>
                <h1 className='text-3xl font-bold'>Seus livros selecionados</h1>
                <p className='text-gray-100 max-w-xl mt-2'>
                  Revise os itens, ajuste quantidades e siga para o checkout
                  quando o pedido estiver pronto.
                </p>
              </div>

              <div className='flex flex-col items-end gap-3'>
                <div className='text-lg font-semibold'>
                  {totalQuantity} item(s) | R$ {subtotal.toFixed(2)}
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Link to='/checkout'>
                    <Button size='md'>Adicionar mais livros</Button>
                  </Link>
                  {hasItems && (
                    <Button variant='secondary' onClick={clearCart}>
                      Limpar carrinho
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!hasItems && (
            <div className='p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800'>
              O carrinho está vazio. Volte para a vitrine e adicione alguns
              livros.
            </div>
          )}

          {hasItems && (
            <div className='bg-white rounded-2xl shadow-md p-4'>
              <div className='space-y-4 divide-y divide-gray-100'>
                {items.map((item) => {
                  const book = findBookById(item.bookId);

                  if (!book) return null;

                  return (
                    <div
                      key={book.id}
                      className='flex flex-col md:flex-row items-center md:items-start justify-between gap-4 py-4'
                    >
                      <div>
                        <div className='text-lg font-semibold'>
                          {book.title}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {book.author}
                        </div>
                        <div className='mt-2 text-sm'>
                          R$ {book.price.toFixed(2)} x {item.quantity}
                        </div>
                      </div>

                      <div className='flex flex-wrap gap-2'>
                        <Button
                          variant='secondary'
                          onClick={() => decreaseBook(book.id)}
                        >
                          -
                        </Button>
                        <Button onClick={() => increaseBook(book.id)}>+</Button>
                        <Button
                          variant='secondary'
                          onClick={() => removeBook(book.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <MercadoPagoCheckout items={items} />
        </div>
      </div>
    </div>
  );
}
