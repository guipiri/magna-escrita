import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  Filter,
  Loader2,
  RotateCw,
  Search,
  School,
} from 'lucide-react';
import {
  getEventBookProduction,
  getEventById,
} from '../services/events-service';
import { EventBookProductionList } from '../components/events/event-book-production-list';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { routes } from '../main';

const formatEventDate = (isoString: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(new Date(isoString));

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  const {
    data: event,
    isLoading: isLoadingEvent,
    error: eventError,
    refetch: refetchEvent,
  } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  });

  const {
    data: productionBooks,
    isLoading: isLoadingProduction,
    error: productionError,
    refetch: refetchProduction,
  } = useQuery({
    queryKey: ['event-production', id],
    queryFn: () => getEventBookProduction(id!),
    enabled: !!id,
  });

  const books = productionBooks ?? [];

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Stage filter
      if (stageFilter === 'WAITING_PRINT' && book.waitingPrintQuantity === 0) {
        return false;
      }
      if (stageFilter === 'PRINTED' && book.printedQuantity === 0) {
        return false;
      }
      if (
        stageFilter === 'DELIVERED_TO_SCHOOL' &&
        book.deliveredToSchoolQuantity === 0
      ) {
        return false;
      }
      if (
        stageFilter === 'DELIVERED_TO_FAMILY' &&
        book.deliveredToFamilyQuantity === 0
      ) {
        return false;
      }

      // Search filter
      const normalizedSearch = search.trim().toLowerCase();
      if (!normalizedSearch) return true;

      const haystack = [
        book.title ?? '',
        book.magnificCode,
        book.student.name,
        book.student.class.name,
        book.student.class.units.school.name,
        ...book.orders.map((o) => `${o.buyerName ?? ''} ${o.buyerEmail}`),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [books, search, stageFilter]);

  const totalCopies = useMemo(
    () => books.reduce((acc, b) => acc + b.totalQuantity, 0),
    [books],
  );

  const totalWaiting = useMemo(
    () => books.reduce((acc, b) => acc + b.waitingPrintQuantity, 0),
    [books],
  );

  const totalPrinted = useMemo(
    () => books.reduce((acc, b) => acc + b.printedQuantity, 0),
    [books],
  );

  const totalDeliveredSchool = useMemo(
    () => books.reduce((acc, b) => acc + b.deliveredToSchoolQuantity, 0),
    [books],
  );

  if (isLoadingEvent || isLoadingProduction) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm'>
            <Loader2 className='size-5 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>
              Carregando dados do evento e produção de livros...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (eventError || productionError || !event) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive shadow-sm'>
            <p className='text-sm font-medium'>
              Erro ao carregar detalhes do evento ou produção.
            </p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                refetchEvent();
                refetchProduction();
              }}
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
        {/* Top bar with back button */}
        <div className='mb-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate(routes.events.path)}
            className='gap-1.5 text-muted-foreground hover:text-foreground'
          >
            <ArrowLeft className='size-4' />
            Voltar para Eventos
          </Button>
        </div>

        {/* Event Header Card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6 mb-6'
        >
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
              <div className='flex flex-wrap items-center gap-2 mb-1'>
                <h1 className='text-xl sm:text-2xl font-semibold text-foreground'>
                  {event.name}
                </h1>
                <Badge variant='outline' className='text-xs'>
                  Ano {event.schoolYear.replace('YEAR_', '')}
                </Badge>
              </div>

              <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground'>
                <span className='flex items-center gap-1.5'>
                  <School className='size-4' />
                  {event.unit.schoolName}
                  {event.unit.name ? ` • ${event.unit.name}` : ''}
                </span>
                <span className='flex items-center gap-1.5'>
                  <Calendar className='size-4' />
                  {formatEventDate(event.date)}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className='flex flex-wrap items-center gap-3'>
              <div className='rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-center min-w-[100px]'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Total Cópias
                </p>
                <p className='text-lg font-bold text-foreground'>{totalCopies}</p>
              </div>
              <div className='rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-center min-w-[100px]'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Aguardando
                </p>
                <p className='text-lg font-bold text-warning-foreground text-yellow-600 dark:text-yellow-400'>
                  {totalWaiting}
                </p>
              </div>
              <div className='rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-center min-w-[100px]'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Impressos
                </p>
                <p className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                  {totalPrinted}
                </p>
              </div>
              <div className='rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-center min-w-[100px]'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Na Escola
                </p>
                <p className='text-lg font-bold text-primary'>
                  {totalDeliveredSchool}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter bar for books */}
          <div className='grid grid-cols-1 sm:grid-cols-12 gap-3 mt-6 pt-4 border-t border-border/70'>
            <div className='relative sm:col-span-8'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Buscar por aluno, título do livro, código ou turma...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>

            <div className='sm:col-span-4'>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className='w-full'>
                  <div className='flex items-center gap-2 truncate'>
                    <Filter className='size-3.5 text-muted-foreground' />
                    <SelectValue placeholder='Filtro de produção' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>Todos os livros com pedidos</SelectItem>
                  <SelectItem value='WAITING_PRINT'>
                    Com cópias aguardando impressão
                  </SelectItem>
                  <SelectItem value='PRINTED'>
                    Com cópias impressas
                  </SelectItem>
                  <SelectItem value='DELIVERED_TO_SCHOOL'>
                    Com cópias entregues à escola
                  </SelectItem>
                  <SelectItem value='DELIVERED_TO_FAMILY'>
                    Com cópias entregues à família
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.section>

        {/* Book Production List */}
        <div>
          <EventBookProductionList eventId={event.id} books={filteredBooks} />
        </div>
      </div>
    </main>
  );
}
