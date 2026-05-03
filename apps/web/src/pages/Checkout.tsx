import { MercadoPagoCheckout } from '../components/MercadoPagoCheckout';
import { useCart } from '../context/cart-context';

export default function CheckoutPage() {
  const { items } = useCart();

  return (
    <div className='min-h-screen bg-gray-50 py-10'>
      <div className='max-w-4xl mx-auto px-4'>
        <h1 className='text-3xl font-bold mb-6'>Checkout</h1>
        <p className='text-gray-600 mb-6'>
          Revise os itens e escolha a forma de pagamento.
        </p>

        <MercadoPagoCheckout items={items} />
      </div>
    </div>
  );
}
