import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FileDown,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  Printer,
  School,
  Truck,
} from 'lucide-react';
import {
  FulfillmentStatusEnum,
  type EventBookProductionItem,
} from '@repo/shared';
import {
  updateEventBookFulfillment,
  updateEventOrderItemFulfillment,
} from '../../services/events-service';
import {
  DataList,
  DataListHeader,
  DataListItem,
  DataListTitle,
} from '../ui/data-list';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  formatOrderDate,
  getFulfillmentStatusConfig,
} from '../../utils/order-status';
import { getErrorMessage } from '../../services/error-messages';

interface EventBookProductionListProps {
  eventId: string;
  books: EventBookProductionItem[];
}

function ProductionEmptyState() {
  return (
    <div className='rounded-xl border border-dashed border-border bg-card p-10 text-center'>
      <div className='mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
        <Printer className='size-5' />
      </div>
      <p className='text-sm font-medium text-foreground'>
        Nenhum livro com pedidos para produção
      </p>
      <p className='mt-1 text-sm text-muted-foreground'>
        Ainda não há pedidos aprovados para os livros deste evento.
      </p>
    </div>
  );
}

export function EventBookProductionList({
  eventId,
  books,
}: EventBookProductionListProps) {
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const toggleExpand = (bookId: string) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  const updateBookMutation = useMutation({
    mutationFn: ({
      bookId,
      status,
    }: {
      bookId: string;
      status: FulfillmentStatusEnum;
    }) => updateEventBookFulfillment(eventId, bookId, status),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Status atualizado com sucesso!', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['event-production', eventId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      orderId,
      bookId,
      status,
    }: {
      orderId: string;
      bookId: string;
      status: FulfillmentStatusEnum;
    }) => updateEventOrderItemFulfillment(eventId, orderId, bookId, status),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Status do item atualizado com sucesso!', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['event-production', eventId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  if (books.length === 0) {
    return <ProductionEmptyState />;
  }

  return (
    <DataList>
      {books.map((book) => {
        const isExpanded = !!expandedBooks[book.bookId];
        const isBookPending =
          updateBookMutation.isPending &&
          updateBookMutation.variables?.bookId === book.bookId;

        return (
          <DataListItem key={book.bookId} className='space-y-4'>
            {/* Header */}
            <DataListHeader className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
              <div className='space-y-1.5'>
                <div className='flex flex-wrap items-center gap-2'>
                  <DataListTitle className='text-base font-semibold text-card-foreground'>
                    {book.title || 'Livro sem título'}
                  </DataListTitle>
                  <Badge variant='outline' className='font-mono text-xs'>
                    {book.magnificCode}
                  </Badge>
                  <Badge variant='default' className='text-xs font-semibold'>
                    Total: {book.totalQuantity}{' '}
                    {book.totalQuantity === 1 ? 'exemplar' : 'exemplares'}
                  </Badge>
                </div>

                <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-1 font-medium text-foreground'>
                    <GraduationCap className='size-3.5' />
                    Aluno: {book.student.name}
                  </span>
                  <span className='flex items-center gap-1'>
                    Turma: {book.student.class.name} (Ano {book.student.class.schoolYear.replace('YEAR_', '')})
                  </span>
                  <span className='flex items-center gap-1'>
                    <School className='size-3.5' />
                    {book.student.class.units.school.name}
                    {book.student.class.units.name ? ` • ${book.student.class.units.name}` : ''}
                  </span>
                </div>
              </div>

              {/* Action Buttons: PDF downloads & Batch update */}
              <div className='flex flex-wrap items-center gap-2 self-start'>
                {/* PDF do Miolo */}
                <Button
                  variant='outline'
                  size='sm'
                  disabled={!book.interiorPdfUrl}
                  onClick={() => window.open(book.interiorPdfUrl!, '_blank')}
                  className='gap-1.5'
                  title={book.interiorPdfUrl ? 'Abrir PDF do Miolo' : 'PDF do Miolo ainda não disponível'}
                >
                  <FileDown className='size-3.5' />
                  PDF Miolo
                </Button>

                {/* PDF da Capa */}
                <Button
                  variant='outline'
                  size='sm'
                  disabled={!book.coverPdfUrl}
                  onClick={() => window.open(book.coverPdfUrl!, '_blank')}
                  className='gap-1.5'
                  title={book.coverPdfUrl ? 'Abrir PDF da Capa' : 'PDF da Capa ainda não disponível'}
                >
                  <FileDown className='size-3.5' />
                  PDF Capa
                </Button>

                {/* Batch status dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='default'
                      size='sm'
                      disabled={isBookPending}
                      className='gap-1.5'
                    >
                      {isBookPending ? (
                        <Loader2 className='size-3.5 animate-spin' />
                      ) : (
                        <Printer className='size-3.5' />
                      )}
                      Produção
                      <ChevronDown className='size-3' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={() =>
                        updateBookMutation.mutate({
                          bookId: book.bookId,
                          status: FulfillmentStatusEnum.WAITING_PRINT,
                        })
                      }
                      className='gap-2'
                    >
                      <Clock className='size-4 text-muted-foreground' />
                      Marcar todas como aguardando impressão
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateBookMutation.mutate({
                          bookId: book.bookId,
                          status: FulfillmentStatusEnum.PRINTED,
                        })
                      }
                      className='gap-2'
                    >
                      <Printer className='size-4 text-info' />
                      Marcar todas como impressas
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateBookMutation.mutate({
                          bookId: book.bookId,
                          status: FulfillmentStatusEnum.DELIVERED_TO_SCHOOL,
                        })
                      }
                      className='gap-2'
                    >
                      <Truck className='size-4 text-primary' />
                      Marcar todas como entregues à escola
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DataListHeader>

            {/* Stage Progress summary */}
            <div className='flex flex-wrap items-center gap-2 pt-1 border-t border-border/70'>
              {book.waitingPrintQuantity > 0 && (
                <Badge variant='secondary' className='text-xs'>
                  <Clock className='size-3' />
                  {book.waitingPrintQuantity} aguardando impressão
                </Badge>
              )}
              {book.printedQuantity > 0 && (
                <Badge variant='info' className='text-xs'>
                  <Printer className='size-3' />
                  {book.printedQuantity} impressos
                </Badge>
              )}
              {book.deliveredToSchoolQuantity > 0 && (
                <Badge variant='default' className='text-xs'>
                  <Truck className='size-3' />
                  {book.deliveredToSchoolQuantity} entregues à escola
                </Badge>
              )}
              {book.deliveredToFamilyQuantity > 0 && (
                <Badge variant='success' className='text-xs'>
                  <Check className='size-3' />
                  {book.deliveredToFamilyQuantity} entregues à família
                </Badge>
              )}

              <Button
                variant='ghost'
                size='sm'
                onClick={() => toggleExpand(book.bookId)}
                className='ml-auto text-xs gap-1 text-muted-foreground hover:text-foreground h-7'
              >
                {book.orders.length} {book.orders.length === 1 ? 'pedido' : 'pedidos'}
                {isExpanded ? (
                  <ChevronUp className='size-3.5' />
                ) : (
                  <ChevronDown className='size-3.5' />
                )}
              </Button>
            </div>

            {/* Expanded: Orders Breakdown */}
            {isExpanded && (
              <div className='mt-3 space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3'>
                <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Detalhamento de Pedidos das Famílias
                </p>

                <div className='divide-y divide-border/70'>
                  {book.orders.map((ord) => {
                    const statusConfig = getFulfillmentStatusConfig(
                      ord.fulfillmentStatus,
                    );
                    const StatusIcon = statusConfig.icon;

                    const isItemPending =
                      updateItemMutation.isPending &&
                      updateItemMutation.variables?.orderId === ord.orderId &&
                      updateItemMutation.variables?.bookId === book.bookId;

                    return (
                      <div
                        key={ord.orderId}
                        className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1'
                      >
                        <div className='space-y-0.5 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <span className='text-xs font-mono text-muted-foreground'>
                              #{ord.orderId.slice(0,8).toUpperCase()}
                            </span>
                            <span className='text-sm font-medium text-foreground truncate'>
                              {ord.buyerName || ord.buyerEmail}
                            </span>
                            <Badge variant='outline' className='text-xs'>
                              {ord.quantity} {ord.quantity === 1 ? 'exemplar' : 'exemplares'}
                            </Badge>
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            {ord.buyerEmail} • Realizado em {formatOrderDate(ord.orderCreatedAt)}
                          </p>
                        </div>

                        <div className='flex items-center gap-2 self-start sm:self-center shrink-0'>
                          <Badge variant={statusConfig.variant}>
                            <StatusIcon className='size-3' />
                            {statusConfig.label}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='size-7'
                                disabled={isItemPending}
                              >
                                {isItemPending ? (
                                  <Loader2 className='size-3.5 animate-spin' />
                                ) : (
                                  <MoreHorizontal className='size-3.5' />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateItemMutation.mutate({
                                    orderId: ord.orderId,
                                    bookId: book.bookId,
                                    status: FulfillmentStatusEnum.WAITING_PRINT,
                                  })
                                }
                                className='gap-2'
                              >
                                <Clock className='size-4 text-muted-foreground' />
                                Marcar item como aguardando impressão
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateItemMutation.mutate({
                                    orderId: ord.orderId,
                                    bookId: book.bookId,
                                    status: FulfillmentStatusEnum.PRINTED,
                                  })
                                }
                                className='gap-2'
                              >
                                <Printer className='size-4 text-info' />
                                Marcar item como impresso
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateItemMutation.mutate({
                                    orderId: ord.orderId,
                                    bookId: book.bookId,
                                    status: FulfillmentStatusEnum.DELIVERED_TO_SCHOOL,
                                  })
                                }
                                className='gap-2'
                              >
                                <Truck className='size-4 text-primary' />
                                Marcar item como entregue à escola
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </DataListItem>
        );
      })}
    </DataList>
  );
}
