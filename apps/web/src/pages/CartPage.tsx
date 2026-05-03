import { Link } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { MercadoPagoCheckout } from '../components/MercadoPagoCheckout';
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
    <Box sx={{ py: 4 }}>
      <Container maxWidth='lg'>
        <Stack spacing={3}>
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              background:
                'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(14,165,233,0.88))',
              color: '#fff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                justifyContent: 'space-between',
                alignItems: { md: 'center' },
              }}
            >
              <Box>
                <Typography variant='overline' sx={{ opacity: 0.8 }}>
                  Carrinho
                </Typography>
                <Typography variant='h3' component='h1' gutterBottom>
                  Seus livros selecionados
                </Typography>
                <Typography
                  variant='body1'
                  sx={{ maxWidth: 720, opacity: 0.9 }}
                >
                  Revise os itens, ajuste quantidades e siga para o checkout
                  quando o pedido estiver pronto.
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
                <Typography variant='h6'>
                  {totalQuantity} item(s) | R$ {subtotal.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button component={Link} to='/checkout' variant='contained'>
                    Adicionar mais livros
                  </Button>
                  {hasItems && (
                    <Button
                      variant='outlined'
                      color='inherit'
                      onClick={clearCart}
                    >
                      Limpar carrinho
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {!hasItems && (
            <Alert severity='info'>
              O carrinho está vazio. Volte para a vitrine e adicione alguns
              livros.
            </Alert>
          )}

          {hasItems && (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {items.map((item) => {
                    const book = findBookById(item.bookId);

                    if (!book) {
                      return null;
                    }

                    return (
                      <Box
                        key={book.id}
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                          gap: 2,
                          alignItems: { md: 'center' },
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
                          <Typography variant='h6'>{book.title}</Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {book.author}
                          </Typography>
                          <Typography variant='body2' sx={{ mt: 1 }}>
                            R$ {book.price.toFixed(2)} x {item.quantity}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          )}

          <MercadoPagoCheckout items={items} />
        </Stack>
      </Container>
    </Box>
  );
}
