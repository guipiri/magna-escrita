import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  CalendarDays,
  Search,
  Building2,
  Clock3,
  CircleSlash,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Pencil,
  RotateCw,
  Loader2,
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
import { CreateEventDialog } from '../components/events/create-event-dialog';
import { EditEventDialog } from '../components/events/edit-event-dialog';

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

function EventTimeline({
  timeline,
  formatDateOnly,
}: {
  timeline: EventResponse['timeline'];
  formatDateOnly: (isoString: string) => string;
}) {
  if (!timeline || timeline.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-4'>
        Nenhuma timeline cadastrada para este evento.
      </p>
    );
  }

  return (
    <div className='relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60'>
      {timeline.map((item, idx) => {
        const itemDate = new Date(item.date);
        const isPast =
          new Date().setHours(0, 0, 0, 0) >= itemDate.setHours(0, 0, 0, 0);

        return (
          <div key={item.id || idx} className='relative flex items-start gap-4'>
            <div
              className={`absolute left-[-24px] flex size-6 items-center justify-center rounded-full border bg-background ${
                isPast
                  ? 'border-emerald-500 text-emerald-500 shadow-sm shadow-emerald-100'
                  : 'border-primary text-primary shadow-sm shadow-primary/10'
              }`}
            >
              {isPast ? (
                <CheckCircle2 className='size-3.5' />
              ) : (
                <Calendar className='size-3.5' />
              )}
            </div>
            <div className='flex-1 space-y-0.5 pt-0.5 ml-1'>
              <p
                className={`text-sm font-medium ${
                  isPast
                    ? 'text-muted-foreground line-through'
                    : 'text-foreground'
                }`}
              >
                {item.details}
              </p>
              <p className='text-xs text-muted-foreground'>
                {formatDateOnly(item.date)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EventsPage() {
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventResponse | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const formatDateOnly = (isoString: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
    }).format(new Date(isoString));

  const { data, isLoading, error, refetch } = useQuery({
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

  const { ongoingOrPlanned, completedEvents, uniqueUnits } = events.reduce(
    (acc, event) => {
      if (event.status === 'ONGOING' || event.status === 'PLANNED') {
        acc.ongoingOrPlanned++;
      } else if (event.status === 'COMPLETED') {
        acc.completedEvents++;
      }
      acc.uniqueUnits.add(event.unit.id);
      return acc;
    },
    { ongoingOrPlanned: 0, completedEvents: 0, uniqueUnits: new Set<string>() },
  );
  const uniqueUnitsCount = uniqueUnits.size;

  if (isLoading) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm'>
            <Loader2 className='size-5 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>
              Carregando eventos...
            </p>
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
              Erro ao carregar eventos. Tente novamente.
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
          className='rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6'
        >
          <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-2'>
              <div>
                <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
                  Eventos
                </h1>
                <p className='mt-2 text-sm text-muted-foreground'>
                  {events.length} eventos • {uniqueUnitsCount} unidades •{' '}
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
                <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
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
                <div className='flex size-10 items-center justify-center rounded-lg bg-success/15 text-success'>
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
                <div className='flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
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
                <div className='divide-y divide-border/70'>
                  {filteredEvents.map((event) => {
                    const status = getEventStatus(event.status);
                    const StatusIcon = status.icon;
                    const isExpanded = expandedEventId === event.id;

                    return (
                      <div
                        key={event.id}
                        className='p-4 sm:p-5 transition-colors hover:bg-muted/20'
                      >
                        <div
                          className='flex items-start justify-between gap-4 cursor-pointer'
                          onClick={() =>
                            setExpandedEventId(isExpanded ? null : event.id)
                          }
                        >
                          <div className='space-y-1.5 min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <Badge
                                variant={status.variant}
                                className='shrink-0'
                              >
                                <StatusIcon className='size-3 mr-1' />
                                {status.label}
                              </Badge>
                              <Badge variant='outline' className='shrink-0'>
                                {event.schoolYear}
                              </Badge>
                            </div>
                            <h3 className='font-semibold text-base sm:text-lg text-foreground leading-snug break-words'>
                              {event.name}
                            </h3>
                            <p className='text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5'>
                              <Calendar className='size-3.5' />
                              <span>Ocorre em {formatDate(event.date)}</span>
                            </p>
                          </div>
                          <div className='flex items-center gap-2 shrink-0 pt-0.5'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-muted-foreground hover:text-foreground'
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(event);
                                setIsEditDialogOpen(true);
                              }}
                              title='Editar evento'
                            >
                              <Pencil className='size-4' />
                            </Button>
                            {isExpanded ? (
                              <ChevronUp className='size-4 text-muted-foreground' />
                            ) : (
                              <ChevronDown className='size-4 text-muted-foreground' />
                            )}
                          </div>
                        </div>

                        <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-muted/30 rounded-xl p-3 border border-border/40'>
                          <div className='space-y-0.5'>
                            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                              Unidade
                            </p>
                            <p className='font-medium text-foreground'>
                              {event.unit.schoolName}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {event.unit.name ?? 'Sem nome de unidade'}
                            </p>
                          </div>
                          <div className='flex flex-col justify-end text-xs text-muted-foreground border-t border-border/30 pt-1.5 sm:border-t-0 sm:border-l sm:border-border/30 sm:pt-0 sm:pl-3 sm:text-right'>
                            <span>Criado em {formatDate(event.createdAt)}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className='mt-4 rounded-xl border border-border/80 bg-muted/30 p-4 sm:p-5 shadow-inner'>
                            <h4 className='text-sm font-semibold text-foreground mb-3 flex items-center gap-2'>
                              <Clock3 className='size-4 text-primary' />{' '}
                              Timeline do Evento
                            </h4>
                            <EventTimeline
                              timeline={event.timeline}
                              formatDateOnly={formatDateOnly}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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

      <EditEventDialog
        event={editingEvent}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingEvent(null);
        }}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setEditingEvent(null);
        }}
      />
    </main>
  );
}
