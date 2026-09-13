import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  BookOpen,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Loader2,
  PackageCheck,
  RotateCcw,
  School,
  ShoppingBag,
  User as UserIcon,
} from 'lucide-react';
import {
  FulfillmentStatusEnum,
  UserRole,
  type BackofficeOrder,
} from '@repo/shared';
import { useAuth } from '../../hooks/auth-hook';
import {
  deliverOrderToFamily,
  revertOrderFamilyDelivery,
} from '../../services/orders-service';
import {
  DataList,
  DataListContent,
  DataListDescription,
  DataListHeader,
  DataListItem,
  DataListTitle,
} from '../ui/data-list';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  formatCurrency,
  formatOrderDate,
  getFulfillmentStatusConfig,
  getPaymentStatusConfig,
} from '../../utils/order-status';
import { getErrorMessage } from '../../services/error-messages';

interface OrdersListProps {
  orders: BackofficeOrder[];
}

function OrdersEmptyState() {
  return (
    <div className='rounded-xl border border-dashed border-border bg-card p-10 text-center'>
      <div className='mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
        <ShoppingBag className='size-5' />
      </div>
      <p className='text-sm font-medium text-foreground'>
        Nenhum pedido encontrado
      </p>
      <p className='mt-1 text-sm text-muted-foreground'>
        Nenhum pedido corresponde aos filtros aplicados.
      </p>
    </div>
  );
}

export function OrdersList({ orders }: OrdersListProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const deliverMutation = useMutation({
    mutationFn: deliverOrderToFamily,
    onSuccess: () => {
      enqueueSnackbar('Pedido marcado como entregue à família com sucesso!', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const revertMutation = useMutation({
    mutationFn: revertOrderFamilyDelivery,
    onSuccess: () => {
      enqueueSnackbar('Entrega à família desfeita com sucesso!', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  if (orders.length === 0) {
    return <OrdersEmptyState />;
  }

  return (
    <DataList>
      {orders.map((order) => {
        const paymentStatus = getPaymentStatusConfig(order.status);
        const PaymentIcon = paymentStatus.icon;

        const orderFulfillmentStatus = getFulfillmentStatusConfig(
          order.fulfillmentStatus,
        );
        const OrderFulfillmentIcon = orderFulfillmentStatus.icon;

        const isDeliveredToFamily =
          order.fulfillmentStatus === FulfillmentStatusEnum.DELIVERED_TO_FAMILY;
        const isDeliverPending =
          deliverMutation.isPending && deliverMutation.variables === order.id;
        const isRevertPending =
          revertMutation.isPending && revertMutation.variables === order.id;

        const isReadyForFamilyDelivery =
          order.items.length > 0 &&
          order.items.every(
            (i) => i.fulfillmentStatus === FulfillmentStatusEnum.DELIVERED_TO_SCHOOL,
          );

        return (
          <DataListItem key={order.id}>
            <DataListHeader className='mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <DataListTitle className='text-base font-semibold text-card-foreground'>
                    Pedido #{order.id.slice(0, 8).toUpperCase()}
                  </DataListTitle>
                  <Badge variant={paymentStatus.variant}>
                    <PaymentIcon className='size-3' />
                    {paymentStatus.label}
                  </Badge>
                  <Badge variant={orderFulfillmentStatus.variant}>
                    <OrderFulfillmentIcon className='size-3' />
                    {orderFulfillmentStatus.label}
                  </Badge>
                </div>
                <DataListDescription className='mt-1'>
                  Realizado em {formatOrderDate(order.createdAt)}
                  {order.deliveredToFamilyAt && (
                    <span className='ml-2 text-xs text-muted-foreground'>
                      • Entregue à família em {formatOrderDate(order.deliveredToFamilyAt)}
                    </span>
                  )}
                </DataListDescription>
              </div>

              {isDeliveredToFamily ? (
                <Button
                  variant='outline'
                  size='sm'
                  disabled={isRevertPending}
                  onClick={() => revertMutation.mutate(order.id)}
                  className='gap-1.5 self-start sm:self-auto w-full sm:w-auto text-muted-foreground hover:text-foreground'
                >
                  {isRevertPending ? (
                    <Loader2 className='size-3.5 animate-spin' />
                  ) : (
                    <RotateCcw className='size-3.5' />
                  )}
                  Desfazer entrega
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='self-start sm:self-auto w-full sm:w-auto inline-flex'>
                      <Button
                        variant='default'
                        size='sm'
                        disabled={!isReadyForFamilyDelivery || isDeliverPending}
                        onClick={() => deliverMutation.mutate(order.id)}
                        className='gap-1.5 w-full sm:w-auto'
                      >
                        {isDeliverPending ? (
                          <Loader2 className='size-3.5 animate-spin' />
                        ) : (
                          <CheckCircle2 className='size-3.5' />
                        )}
                        Marcar como entregue
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!isReadyForFamilyDelivery && (
                    <TooltipContent>
                      Todos os itens devem estar entregues à escola para liberar a entrega à família.
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </DataListHeader>

            <DataListContent className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4'>
              {/* Buyer Info */}
              <div className='rounded-lg border border-border/70 bg-muted/20 p-3 sm:p-4'>
                <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                  <UserIcon className='size-4' />
                  <span className='text-xs font-medium uppercase tracking-wide'>
                    Comprador
                  </span>
                </div>
                <p className='text-sm font-semibold text-foreground truncate'>
                  {order.user.name || order.email}
                </p>
                <p className='text-xs text-muted-foreground truncate'>
                  {order.email}
                </p>
              </div>

              {/* Payment / Financial Info (Admin only) */}
              {isAdmin ? (
                <div className='rounded-lg border border-border/70 bg-muted/20 p-3 sm:p-4'>
                  <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                    <CreditCard className='size-4' />
                    <span className='text-xs font-medium uppercase tracking-wide'>
                      Pagamento
                    </span>
                  </div>
                  <div className='flex items-baseline justify-between gap-2'>
                    <p className='text-sm font-semibold text-foreground'>
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className='text-xs text-muted-foreground capitalize'>
                      {order.paymentMethodDetail || order.paymentMethod}
                      {order.installments > 1 && ` (${order.installments}x)`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className='rounded-lg border border-border/70 bg-muted/20 p-3 sm:p-4'>
                  <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                    <PackageCheck className='size-4' />
                    <span className='text-xs font-medium uppercase tracking-wide'>
                      Status de Entrega
                    </span>
                  </div>
                  <p className='text-sm font-semibold text-foreground'>
                    {orderFulfillmentStatus.label}
                  </p>
                </div>
              )}
            </DataListContent>

            {/* Order Items */}
            <div className='space-y-2 pt-2 border-t border-border/70'>
              <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2'>
                Livros do Pedido ({order.items.length})
              </p>
              <div className='grid grid-cols-1 gap-2'>
                {order.items.map((item) => {
                  const itemFulfillment = getFulfillmentStatusConfig(
                    item.fulfillmentStatus,
                  );
                  const ItemStatusIcon = itemFulfillment.icon;

                  return (
                    <div
                      key={item.bookId}
                      className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/50 p-3'
                    >
                      <div className='space-y-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <BookOpen className='size-4 text-primary shrink-0' />
                          <p className='text-sm font-medium text-foreground truncate'>
                            {item.book.title || 'Sem título'}
                          </p>
                          <Badge variant='outline' className='text-xs'>
                            {item.quantity} {item.quantity === 1 ? 'cópia' : 'cópias'}
                          </Badge>
                        </div>
                        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                          <span className='flex items-center gap-1'>
                            <GraduationCap className='size-3.5' />
                            {item.book.student.name}
                          </span>
                          <span className='flex items-center gap-1'>
                            Turma {item.book.student.class.name}
                          </span>
                          <span className='flex items-center gap-1'>
                            <School className='size-3.5' />
                            {item.book.student.class.units.school.name}
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center gap-2 self-start sm:self-center shrink-0'>
                        <Badge variant={itemFulfillment.variant}>
                          <ItemStatusIcon className='size-3' />
                          {itemFulfillment.label}
                        </Badge>
                        {isAdmin && item.amount !== null && (
                          <span className='text-xs font-medium text-muted-foreground'>
                            {formatCurrency(item.amount * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DataListItem>
        );
      })}
    </DataList>
  );
}
