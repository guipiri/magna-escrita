import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GetOrdersRes, OrderSummary } from '@repo/shared';
import { getOrders } from '../services/order-service';

const statusStyles: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  APPROVED: {
    label: 'Pagamento aprovado',
    className: 'bg-green-50 text-green-700',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Em analise',
    className: 'bg-yellow-50 text-yellow-700',
    icon: Clock,
  },
  CANCELED: {
    label: 'Cancelado',
    className: 'bg-red-50 text-red-700',
    icon: XCircle,
  },
  REFUNDED: {
    label: 'Reembolsado',
    className: 'bg-purple-50 text-purple-700',
    icon: RotateCcw,
  },
};

const getStatusConfig = (status?: string) =>
  status
    ? (statusStyles[status] ?? statusStyles.PENDING)
    : statusStyles.PENDING;

const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

const getOrderPreview = (order: OrderSummary) => {
  const items = order.items ?? [];
  const preview = items.slice(0, 3);
  const remaining = items.length - preview.length;

  return { preview, remaining };
};

export function OrdersPage() {
  const { data, isLoading, error } = useQuery<GetOrdersRes>({
    queryKey: ['orders'],
    queryFn: getOrders,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  console.log('OrdersPage data:', data);

  const orders = data?.orders ?? [];

  return (
    <main className='max-w-5xl mx-auto px-4 py-6 md:py-10'>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='mb-8 text-center'
      >
        <h1 className='text-4xl md:text-5xl lg:text-6xl mb-4 bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent'>
          Seus pedidos
        </h1>
        <p className='text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed'>
          Aqui voce vai acompanhar seu historico de compras.
        </p>
      </motion.section>

      {isLoading ? (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-2xl border border-purple-100 bg-white/90 backdrop-blur p-6 text-center shadow-md'
        >
          Carregando seus pedidos...
        </motion.section>
      ) : null}

      {!isLoading && error ? (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-2xl border border-red-100 bg-red-50/80 p-6 text-center text-red-700 shadow-md'
        >
          Nao foi possivel carregar seus pedidos agora.
        </motion.section>
      ) : null}

      {!isLoading && !error && orders.length === 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-2xl border border-purple-100 bg-white/90 backdrop-blur p-6 text-center shadow-md'
        >
          Você ainda não fez um pedido
        </motion.section>
      ) : null}

      {!isLoading && !error && orders.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='space-y-4'
        >
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const { preview, remaining } = getOrderPreview(order);
            const totalAmount = Number(order.totalAmount ?? 0);
            const totalQuantity = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );

            return (
              <Link
                key={order.id}
                to={`/order/${order.id}`}
                className='block rounded-2xl border border-purple-100 bg-white/90 backdrop-blur p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg'
              >
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${statusConfig.className}`}
                  >
                    <StatusIcon className='h-4 w-4' />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>

                <div className='mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center'>
                  <div className='space-y-2 text-sm text-gray-600'>
                    {preview.map((item) => (
                      <div key={item.bookId} className='flex items-center'>
                        <span className='font-medium text-gray-700'>
                          {item.book.title}
                        </span>
                        <span className='ml-2 text-xs text-gray-500'>
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                    {remaining > 0 ? (
                      <div className='text-xs text-gray-500'>
                        +{remaining} item(s) adicionais
                      </div>
                    ) : null}
                  </div>

                  <div className='text-right'>
                    <div className='text-xs text-gray-500'>Total</div>
                    <div className='text-lg font-semibold text-purple-700'>
                      {formatCurrency(totalAmount)}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {totalQuantity} item(s)
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </motion.section>
      ) : null}
    </main>
  );
}
