import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  CalendarDays,
  Search,
  Building2,
  Clock3,
  CircleSlash,
} from 'lucide-react';
import type { EventResponse } from '@repo/shared';
import { getEvents } from '../services/events-service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { CreateEventDialog } from '../components/events/create-event-dialog';

const formatDate = (isoString: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString));

const getEventStatus = (status: EventResponse['status']) => {
  switch (status) {
    case 'ONGOING':
      return {
        label: 'Em andamento',
        variant: 'default' as const,
        icon: Clock3,
      };
    case 'COMPLETED':
      return {
        label: 'Concluído',
        variant: 'outline' as const,
        icon: Building2,
      };
    case 'CANCELED':
      return {
        label: 'Cancelado',
        variant: 'destructive' as const,
        icon: CircleSlash,
      };
    case 'PLANNED':
    default:
      return {
        label: 'Planejado',
        variant: 'secondary' as const,
        icon: CalendarDays,
      };
  }
};

export function EventsPage() {
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });

  const events = data ?? [];

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return events;
    }

    return events.filter((event) => {
      const haystack = [
        event.name,
        event.unit.schoolName,
        event.unit.name ?? '',
        event.schoolYear,
        event.status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [events, search]);

  const ongoingOrPlanned = events.filter(
    (event) => event.status === 'ONGOING' || event.status === 'PLANNED',
  ).length;
  const completedEvents = events.filter(
    (event) => event.status === 'COMPLETED',
  ).length;
  const uniqueUnits = new Set(events.map((event) => event.unit.id)).size;

  if (isLoading) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
          <Card>
            <CardContent className='p-6'>
              <p className='text-sm text-muted-foreground'>
                Carregando eventos...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
          <Card className='border-red-200 bg-red-50'>
            <CardContent className='p-6'>
              <p className='text-sm text-red-600'>
                Erro ao carregar eventos. Tente novamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 overflow-auto'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-3xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6'
        >
          <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-2'>
              <div>
                <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
                  Eventos
                </h1>
                <p className='mt-2 text-sm text-muted-foreground'>
                  {events.length} eventos • {uniqueUnits} unidades •{' '}
                  {ongoingOrPlanned} ativos
                </p>
              </div>
              <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
                <span className='rounded-full border border-border/70 bg-background px-3 py-1'>
                  Cadastro centralizado
                </span>
                <span className='rounded-full border border-border/70 bg-background px-3 py-1'>
                  Listagem responsiva
                </span>
              </div>
            </div>

            <div className='flex w-full flex-col gap-3 sm:max-w-md'>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  type='search'
                  placeholder='Buscar eventos, livros ou turmas...'
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className='pl-9'
                />
              </div>

              <Button
                type='button'
                onClick={() => setIsCreateDialogOpen(true)}
                className='w-full sm:w-auto sm:self-end'
              >
                <CalendarDays className='h-4 w-4' />
                Novo evento
              </Button>
            </div>
          </div>

          <div className='mt-6 grid gap-4 md:grid-cols-3'>
            <Card>
              <CardContent className='flex items-center gap-3 p-5'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                  <CalendarDays className='size-5' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Eventos</p>
                  <p className='text-2xl font-semibold text-foreground'>
                    {events.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='flex items-center gap-3 p-5'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600'>
                  <CalendarDays className='size-5' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Ativos</p>
                  <p className='text-2xl font-semibold text-foreground'>
                    {ongoingOrPlanned}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='flex items-center gap-3 p-5'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600'>
                  <Building2 className='size-5' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Concluídos</p>
                  <p className='text-2xl font-semibold text-foreground'>
                    {completedEvents}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        <div className='mt-6'>
          <Card>
            <CardHeader className='border-b border-border/70'>
              <CardTitle>Lista de eventos</CardTitle>
              <CardDescription>
                Veja os eventos cadastrados e as turmas vinculadas.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              {filteredEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ano letivo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => {
                      const status = getEventStatus(event.status);
                      const StatusIcon = status.icon;

                      return (
                        <TableRow key={event.id}>
                          <TableCell className='max-w-60'>
                            <div className='space-y-1'>
                              <p className='font-medium text-foreground'>
                                {event.name}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                Criado em {formatDate(event.createdAt)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(event.date)}</TableCell>
                          <TableCell>
                            <Badge variant='outline'>{event.schoolYear}</Badge>
                          </TableCell>
                          <TableCell className='max-w-60'>
                            <div className='space-y-1'>
                              <p className='font-medium text-foreground'>
                                {event.unit.schoolName}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                {event.unit.name ?? 'Sem nome de unidade'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              <StatusIcon className='size-3.5' />
                              {status.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className='p-6 text-sm text-muted-foreground'>
                  Nenhum evento encontrado para o filtro atual.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateEventDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
        }}
      />
    </main>
  );
}
