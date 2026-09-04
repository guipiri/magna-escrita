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
  Pencil,
  RotateCw,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import type { EventResponse } from '@repo/shared';
import { getEvents } from '../services/events-service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  DataList,
  DataListContent,
  DataListDescription,
  DataListHeader,
  DataListItem,
  DataListTitle,
} from '../components/ui/data-list';
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
          <div className='flex w-full gap-3 flex-wrap'>
            <div className='relative w-full flex-10'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Buscar por evento, escola, unidade ou ano...'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className='pl-9'
              />
            </div>

            <Button
              type='button'
              onClick={() => setIsCreateDialogOpen(true)}
              className='w-full md:w-auto'
            >
              <CalendarDays className='h-4 w-4' />
              Novo evento
            </Button>
          </div>
        </motion.section>

        <div className='mt-6'>
          {filteredEvents.length === 0 ? (
            <div className='rounded-xl border border-dashed border-border bg-card p-10 text-center'>
              <div className='mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <CalendarDays className='size-5' />
              </div>
              <p className='text-sm font-medium text-foreground'>
                Nenhum evento encontrado
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Nenhum evento corresponde ao filtro atual.
              </p>
            </div>
          ) : (
            <DataList>
              {filteredEvents.map((event) => {
                const status = getEventStatus(event.status);
                const StatusIcon = status.icon;
                const isExpanded = expandedEventId === event.id;

                return (
                  <DataListItem key={event.id}>
                    <DataListHeader className='mb-4 flex items-start'>
                      <div>
                        <div className='flex flex-wrap items-center gap-2'>
                          <DataListTitle className='truncate'>
                            {event.name}
                          </DataListTitle>
                          <Badge variant={status.variant}>
                            <StatusIcon className='size-3 mr-1' />
                            {status.label}
                          </Badge>
                          <span className='inline-flex items-center rounded-full border border-border/70 px-2.5 py-0.5 text-xs text-muted-foreground'>
                            {event.schoolYear}
                          </span>
                        </div>
                        <DataListDescription className='mt-0.5'>
                          Ocorre em {formatDate(event.date)}
                        </DataListDescription>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className='h-8 w-8 p-0'
                            variant='ghost'
                            size='icon'
                            aria-label='Ações do evento'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align='end'
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingEvent(event);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className='mr-2 h-4 w-4' />
                            Editar evento
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setExpandedEventId(isExpanded ? null : event.id)
                            }
                          >
                            <Clock3 className='mr-2 h-4 w-4' />
                            {isExpanded ? 'Ocultar timeline' : 'Ver timeline'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </DataListHeader>

                    <DataListContent className='sm:grid-cols-3'>
                      <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
                        <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                          <Building2 className='h-4 w-4' />
                          <span className='text-xs font-medium uppercase tracking-wide'>
                            Unidade
                          </span>
                        </div>
                        <p className='text-sm font-semibold text-foreground truncate'>
                          {event.unit.schoolName}
                        </p>
                        {event.unit.name && (
                          <p className='text-xs text-muted-foreground truncate'>
                            {event.unit.name}
                          </p>
                        )}
                      </div>

                      <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
                        <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                          <Calendar className='h-4 w-4' />
                          <span className='text-xs font-medium uppercase tracking-wide'>
                            Data do Evento
                          </span>
                        </div>
                        <p className='text-sm font-semibold text-foreground'>
                          {formatDateOnly(event.date)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          Ano letivo {event.schoolYear}
                        </p>
                      </div>

                      <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
                        <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                          <Clock3 className='h-4 w-4' />
                          <span className='text-xs font-medium uppercase tracking-wide'>
                            Timeline
                          </span>
                        </div>
                        <p className='text-sm font-semibold text-foreground'>
                          {event.timeline?.length ?? 0}{' '}
                          {event.timeline?.length === 1 ? 'etapa' : 'etapas'}
                        </p>
                        <button
                          type='button'
                          onClick={() =>
                            setExpandedEventId(isExpanded ? null : event.id)
                          }
                          className='text-xs text-primary hover:underline mt-0.5 text-left flex items-center gap-1 cursor-pointer'
                        >
                          {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                        </button>
                      </div>
                    </DataListContent>

                    {isExpanded && (
                      <div className='mt-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5'>
                        <h4 className='text-sm font-semibold text-foreground mb-3 flex items-center gap-2'>
                          <Clock3 className='size-4 text-primary' /> Timeline do
                          Evento
                        </h4>
                        <EventTimeline
                          timeline={event.timeline}
                          formatDateOnly={formatDateOnly}
                        />
                      </div>
                    )}
                  </DataListItem>
                );
              })}
            </DataList>
          )}
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
