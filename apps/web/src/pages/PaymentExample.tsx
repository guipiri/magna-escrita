import { Link } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { MercadoPagoCheckout } from '../components/MercadoPagoCheckout';
import { useCart } from '../context/cart-context';
import { BOOKS, findBookById } from '../data/books';

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
    <Box sx={{ py: 4 }}>
      <Container maxWidth='lg'>
        <Stack spacing={3}>
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              background:
                'linear-gradient(135deg, rgba(17,24,39,0.96), rgba(79,70,229,0.9))',
              color: '#fff',
              boxShadow: '0 24px 80px rgba(15,23,42,0.2)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                alignItems: { md: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Chip
                  label='Livraria Magna'
                  sx={{
                    mb: 2,
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.35)',
                  }}
                  variant='outlined'
                />
                <Typography variant='h3' component='h1' gutterBottom>
                  Monte seu carrinho de livros
                </Typography>
                <Typography
                  variant='body1'
                  sx={{ maxWidth: 720, opacity: 0.9 }}
                >
                  Adicione, remova e aumente quantidades com um carrinho
                  persistido. Depois siga para a página de carrinho para revisar
                  tudo e pagar.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  alignItems: { xs: 'flex-start', md: 'flex-end' },
                }}
              >
                <Alert
                  severity='info'
                  sx={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
                >
                  {totalQuantity} item(s) no carrinho
                </Alert>
                <Button
                  component={Link}
                  to='/cart'
                  variant='contained'
                  size='large'
                >
                  Ver carrinho
                </Button>
              </Box>
            </Box>
          </Box>

          {items.length > 0 && (
            <Alert severity='success'>
              Carrinho ativo com total estimado de R$ {total.toFixed(2)}.
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 3,
            }}
          >
            {BOOKS.map((book) => {
              const currentItem = items.find((item) => item.bookId === book.id);
              const quantity = currentItem?.quantity ?? 0;

              return (
                <Card
                  key={book.id}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    border: '1px solid rgba(148,163,184,0.18)',
                    boxShadow: '0 18px 45px rgba(15,23,42,0.08)',
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant='overline' color='text.secondary'>
                          {book.author}
                        </Typography>
                        <Typography variant='h6' component='h2'>
                          {book.title}
                        </Typography>
                      </Box>

                      <Typography variant='body2' color='text.secondary'>
                        {book.description}
                      </Typography>

                      <Typography variant='h5' color='primary'>
                        R$ {book.price.toFixed(2)}
                      </Typography>

                      {quantity > 0 ? (
                        <Stack spacing={1.5}>
                          <Alert severity='success'>
                            {quantity} exemplar{quantity > 1 ? 'es' : ''} no
                            carrinho
                          </Alert>

                          <Box
                            sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
                          >
                            <Button
                              variant='outlined'
                              onClick={() => decreaseBook(book.id)}
                            >
                              -
                            </Button>
                            <Button
                              variant='contained'
                              onClick={() => increaseBook(book.id)}
                            >
                              +
                            </Button>
                            <Button
                              color='error'
                              variant='text'
                              onClick={() => removeBook(book.id)}
                            >
                              Remover
                            </Button>
                          </Box>
                        </Stack>
                      ) : (
                        <Button
                          fullWidth
                          variant='contained'
                          onClick={() => addBook(book.id)}
                        >
                          Adicionar ao carrinho
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <MercadoPagoCheckout
            items={items}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Stack>
      </Container>
    </Box>
  );
}

export default PaymentExample;
