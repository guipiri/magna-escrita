import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  Filter,
  Loader2,
  RotateCw,
  Search,
} from 'lucide-react';
import {
  FulfillmentStatusEnum,
  OrderStatusEnum,
} from '@repo/shared';
import { getBackofficeOrders } from '../services/orders-service';
import { OrdersList } from '../components/orders/orders-list';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function OrdersPage() {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('ALL');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: getBackofficeOrders,
  });

  const orders = data ?? [];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Payment filter
      if (paymentFilter !== 'ALL' && order.status !== paymentFilter) {
        return false;
      }

      // Fulfillment filter
      if (
        fulfillmentFilter !== 'ALL' &&
        order.fulfillmentStatus !== fulfillmentFilter
      ) {
        return false;
      }

      // Search term filter
      const normalizedSearch = search.trim().toLowerCase();
      if (!normalizedSearch) return true;

      const haystack = [
        order.id,
        order.mpId,
        order.user.name ?? '',
        order.email,
        ...order.items.map((item) =>
          [
            item.book.title ?? '',
            item.book.magnificCode,
            item.book.student.name,
            item.book.student.class.name,
            item.book.student.class.units.school.name,
            item.book.student.class.units.name ?? '',
          ].join(' '),
        ),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [orders, search, paymentFilter, fulfillmentFilter]);

  if (isLoading) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm'>
            <Loader2 className='size-5 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Carregando pedidos...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive shadow-sm'>
            <p className='text-sm font-medium'>
              Erro ao carregar pedidos. Tente novamente.
            </p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              className='gap-2 text-destructive border-destructive/30 hover:bg-destructive/10'
            >
              <RotateCw className='size-3.5' />
              Recarregar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 overflow-auto'>
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6 mb-6'
        >
          <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-xl font-semibold text-foreground'>
                  Pedidos
                </h1>
                <p className='text-sm text-muted-foreground mt-0.5'>
                  Gerenciamento de pedidos e confirmação de entrega às famílias.
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-12 gap-3'>
              {/* Search input */}
              <div className='relative sm:col-span-6'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  type='search'
                  placeholder='Buscar por pedido, comprador, aluno, livro ou turma...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-9'
                />
              </div>

              {/* Payment filter */}
              <div className='sm:col-span-3'>
                <Select
                  value={paymentFilter}
                  onValueChange={setPaymentFilter}
                >
                  <SelectTrigger className='w-full'>
                    <div className='flex items-center gap-2 truncate'>
                      <Filter className='size-3.5 text-muted-foreground' />
                      <SelectValue placeholder='Pagamento' />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>Todos os pagamentos</SelectItem>
                    <SelectItem value={OrderStatusEnum.APPROVED}>Aprovados</SelectItem>
                    <SelectItem value={OrderStatusEnum.PENDING}>Pendentes</SelectItem>
                    <SelectItem value={OrderStatusEnum.CANCELED}>Cancelados</SelectItem>
                    <SelectItem value={OrderStatusEnum.REFUNDED}>Reembolsados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fulfillment filter */}
              <div className='sm:col-span-3'>
                <Select
                  value={fulfillmentFilter}
                  onValueChange={setFulfillmentFilter}
                >
                  <SelectTrigger className='w-full'>
                    <div className='flex items-center gap-2 truncate'>
                      <Filter className='size-3.5 text-muted-foreground' />
                      <SelectValue placeholder='Status de entrega' />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>Todos os status</SelectItem>
                    <SelectItem value={FulfillmentStatusEnum.WAITING_PRINT}>
                      Aguardando impressão
                    </SelectItem>
                    <SelectItem value={FulfillmentStatusEnum.PRINTED}>
                      Impressos
                    </SelectItem>
                    <SelectItem value={FulfillmentStatusEnum.DELIVERED_TO_SCHOOL}>
                      Entregues à escola
                    </SelectItem>
                    <SelectItem value={FulfillmentStatusEnum.DELIVERED_TO_FAMILY}>
                      Entregues à família
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </motion.section>

        <div>
          <OrdersList orders={filteredOrders} />
        </div>
      </div>
    </main>
  );
}
