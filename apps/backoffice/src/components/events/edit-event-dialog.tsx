import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { CalendarDays, Loader2 } from 'lucide-react';
import {
  type SchoolYear,
  type SchoolYearOption,
  type EventResponse,
  type EventStatus,
  DEFAULT_TIMELINE_TEMPLATES,
  DEFAULT_TIMELINE_OFFSETS,
  calculateTimelineDate,
  UpdateEventRequest,
} from '@repo/shared';
import { updateEvent } from '../../services/events-service';
import { getErrorMessage } from '../../services/error-messages';
import { getSchoolUnits, getSchoolYears } from '../../services/schools-service';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface EditEventDialogProps {
  event: EventResponse | null;
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface UnitOption {
  id: string;
  name: string | null;
  schoolName: string;
}

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'PLANNED', label: 'Planejado' },
  { value: 'ONGOING', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELED', label: 'Cancelado' },
];

const TIMELINE_LABELS = DEFAULT_TIMELINE_TEMPLATES.map((tpl) =>
  tpl.offsetDays === 0
    ? `${tpl.details} (dia do evento)`
    : `${tpl.details} (${tpl.offsetDays} dias antes)`,
);

export function EditEventDialog({
  event,
  isOpen,
  onClose,
  onSuccess,
}: EditEventDialogProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [schoolYear, setSchoolYear] = useState<SchoolYear | ''>('');
  const [unitId, setUnitId] = useState('');
  const [status, setStatus] = useState<EventStatus>('PLANNED');
  const [useDefaultTimeline, setUseDefaultTimeline] = useState(true);
  const [timelineDates, setTimelineDates] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: schoolUnits, isLoading: isUnitsLoading } = useQuery({
    queryKey: ['school-units'],
    queryFn: getSchoolUnits,
    enabled: isOpen && !!event,
  });

  const { data: schoolYears } = useQuery<SchoolYearOption[]>({
    queryKey: ['school-years'],
    queryFn: getSchoolYears,
    enabled: isOpen && !!event,
  });

  const units = useMemo<UnitOption[]>(() => {
    return (schoolUnits ?? []).flatMap((school) =>
      school.units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        schoolName: school.name,
      })),
    );
  }, [schoolUnits]);

  useEffect(() => {
    if (isOpen && event) {
      setName(event.name);
      setDate(event.date.slice(0, 10));
      setSchoolYear(event.schoolYear);
      setUnitId(event.unit.id);
      setStatus(event.status);

      const isDefault = (() => {
        if (
          !event.timeline ||
          event.timeline.length !== DEFAULT_TIMELINE_OFFSETS.length
        ) {
          return false;
        }
        const eventDateStr = event.date.slice(0, 10);
        for (let i = 0; i < DEFAULT_TIMELINE_OFFSETS.length; i++) {
          const expected = calculateTimelineDate(
            eventDateStr,
            DEFAULT_TIMELINE_OFFSETS[i] ?? 0,
          );
          const tpl = DEFAULT_TIMELINE_TEMPLATES[i];
          if (!tpl) return false;
          const found = event.timeline.find((t) => t.details === tpl.details);
          if (!found || found.date.slice(0, 10) !== expected) return false;
        }
        return true;
      })();

      setUseDefaultTimeline(isDefault);

      const dates = DEFAULT_TIMELINE_TEMPLATES.map((tpl) => {
        const found = event.timeline?.find((t) => t.details === tpl.details);
        if (found) {
          return found.date.slice(0, 10);
        }
        return calculateTimelineDate(event.date.slice(0, 10), tpl.offsetDays);
      });
      setTimelineDates(dates);
    }
  }, [isOpen, event]);

  useEffect(() => {
    if (useDefaultTimeline && date) {
      const newDates = DEFAULT_TIMELINE_OFFSETS.map((offset) =>
        calculateTimelineDate(date, offset),
      );
      setTimelineDates(newDates);
    }
  }, [date, useDefaultTimeline]);

  const isTimelineValid = useMemo(() => {
    if (!event) return false;
    const todayStr = new Date().toISOString().slice(0, 10);

    let proposedDates: string[] = [];
    if (useDefaultTimeline) {
      if (!date) return false;
      proposedDates = DEFAULT_TIMELINE_OFFSETS.map((offset) =>
        calculateTimelineDate(date, offset),
      );
    } else {
      if (timelineDates.length !== DEFAULT_TIMELINE_OFFSETS.length)
        return false;
      proposedDates = timelineDates;
    }

    // Check chronological order
    for (let i = 0; i < proposedDates.length - 1; i++) {
      const current = proposedDates[i];
      const next = proposedDates[i + 1];
      if (!current || !next) return false;
      if (current > next) {
        return false;
      }
    }

    // Check past dates only for MODIFIED dates!
    for (let i = 0; i < proposedDates.length; i++) {
      const newDateStr = proposedDates[i];
      if (!newDateStr) continue;
      const tpl = DEFAULT_TIMELINE_TEMPLATES[i];
      if (!tpl) continue;
      const oldItem = event.timeline?.find((t) => t.details === tpl.details);
      const oldDateStr = oldItem?.date?.slice(0, 10);
      const isModified = newDateStr !== oldDateStr;

      if (isModified && newDateStr < todayStr) {
        return false;
      }
    }

    return true;
  }, [useDefaultTimeline, timelineDates, date, event]);

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventRequest }) =>
      updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      enqueueSnackbar('Evento atualizado com sucesso!', { variant: 'success' });
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !event ||
      !name.trim() ||
      !date ||
      !schoolYear ||
      !unitId ||
      !isTimelineValid
    ) {
      return;
    }

    const isoTimelineDates = timelineDates.map((d) =>
      new Date(`${d}T12:00:00`).toISOString(),
    );

    updateEventMutation.mutate({
      id: event.id,
      data: {
        name: name.trim(),
        date: new Date(`${date}T12:00:00`).toISOString(),
        schoolYear,
        unitId,
        useDefaultTimeline,
        timelineDates: useDefaultTimeline ? undefined : isoTimelineDates,
        status,
      },
    });
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
  };

  const isLoading = isUnitsLoading;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange} modal={false}>
      <DialogContent
        className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'
        aria-describedby={undefined}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className='flex flex-row items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <CalendarDays className='size-5' />
          </div>
          <div>
            <DialogTitle>Editar evento</DialogTitle>
            <p className='text-sm text-muted-foreground'>
              Altere as informações do evento e prazos da timeline.
            </p>
          </div>
        </DialogHeader>

        {updateEventMutation.isError ? (
          <div className='rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {getErrorMessage(updateEventMutation.error) ||
              'Erro ao salvar alterações do evento. Tente novamente.'}
          </div>
        ) : null}

        {isLoading ? (
          <div className='rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground flex items-center justify-center gap-2'>
            <Loader2 className='size-4 animate-spin text-primary' />
            <span>Carregando opções do evento...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>
                  Nome do evento
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Ex: Sessão de autógrafos do 5º ano'
                  required
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>
                  Data
                </label>
                <Input
                  type='date'
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>
                  Ano letivo
                </label>
                <Select
                  value={schoolYear}
                  onValueChange={(value) => setSchoolYear(value as SchoolYear)}
                  disabled={event?.hasBooks}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecione o ano letivo' />
                  </SelectTrigger>
                  <SelectContent>
                    {(schoolYears ?? []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>
                  Unidade
                </label>
                <Select
                  value={unitId}
                  onValueChange={setUnitId}
                  disabled={event?.hasBooks}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecione uma unidade' />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.schoolName}
                        {unit.name ? ` • ${unit.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2 md:col-span-2'>
                <label className='text-sm font-medium text-foreground'>
                  Status do Evento
                </label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as EventStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecione o status' />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {event?.hasBooks && (
                <div className='md:col-span-2 rounded-lg border border-info/30 bg-info/10 px-4 py-3 text-xs text-info'>
                  Ano letivo e unidade não podem ser alterados porque já existem
                  livros vinculados a este evento.
                </div>
              )}
            </div>

            <div className='flex items-center space-x-2 rounded-lg border border-border bg-muted/20 p-3'>
              <input
                type='checkbox'
                id='useDefaultTimeline'
                checked={useDefaultTimeline}
                onChange={(e) => setUseDefaultTimeline(e.target.checked)}
                className='size-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer'
              />
              <label
                htmlFor='useDefaultTimeline'
                className='text-sm font-medium text-foreground cursor-pointer select-none'
              >
                Usar prazos padrão
              </label>
            </div>

            {!useDefaultTimeline && (
              <div className='space-y-4 rounded-xl border border-border p-4 bg-muted/10'>
                <div>
                  <h3 className='text-sm font-medium text-foreground'>
                    Datas do Cronograma Personalizado
                  </h3>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  {TIMELINE_LABELS.map((label, index) => {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    const isOrderError =
                      index > 0 &&
                      timelineDates[index] &&
                      timelineDates[index - 1] &&
                      timelineDates[index] < timelineDates[index - 1];

                    const tpl = DEFAULT_TIMELINE_TEMPLATES[index];
                    const oldItem = event?.timeline?.find(
                      (t) => t.details === tpl?.details,
                    );
                    const oldDateStr = oldItem?.date?.slice(0, 10);
                    const isModified = timelineDates[index] !== oldDateStr;
                    const isPastError =
                      isModified &&
                      timelineDates[index] &&
                      timelineDates[index] < todayStr;

                    const isError = isOrderError || isPastError;

                    return (
                      <div key={index} className='space-y-1 min-w-0'>
                        <label
                          htmlFor={`timelineDate-${index}`}
                          className='text-xs font-medium text-muted-foreground block wrap-break-word'
                          title={label}
                        >
                          {index + 1}. {label}
                        </label>
                        <Input
                          id={`timelineDate-${index}`}
                          type='date'
                          value={timelineDates[index] || ''}
                          onChange={(e) => {
                            const newDates = [...timelineDates];
                            newDates[index] = e.target.value;
                            setTimelineDates(newDates);
                          }}
                          className={
                            isError
                              ? 'border-destructive focus-visible:ring-destructive'
                              : ''
                          }
                        />
                        {isError && (
                          <p className='text-[10px] text-destructive'>
                            {isPastError
                              ? 'A data modificada não pode estar no passado.'
                              : 'A data não pode ser anterior ao evento anterior.'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isTimelineValid &&
              (() => {
                const todayStr = new Date().toISOString().slice(0, 10);

                if (useDefaultTimeline) {
                  const proposedDates = DEFAULT_TIMELINE_OFFSETS.map((offset) =>
                    calculateTimelineDate(date, offset),
                  );
                  const hasPastError = proposedDates.some(
                    (newDateStr, index) => {
                      const tpl = DEFAULT_TIMELINE_TEMPLATES[index];
                      const oldItem = event?.timeline?.find(
                        (t) => t.details === tpl?.details,
                      );
                      const oldDateStr = oldItem?.date?.slice(0, 10);
                      return newDateStr !== oldDateStr && newDateStr < todayStr;
                    },
                  );

                  if (hasPastError) {
                    return (
                      <div className='rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700'>
                        Atenção: Uma ou mais datas modificadas calculadas a
                        partir da data do evento estão no passado. Escolha uma
                        data posterior ou desmarque "Usar prazos padrão" para
                        personalizar.
                      </div>
                    );
                  }
                } else {
                  let orderError = false;
                  for (let i = 0; i < timelineDates.length - 1; i++) {
                    const current = timelineDates[i];
                    const next = timelineDates[i + 1];
                    if (current && next && current > next) {
                      orderError = true;
                      break;
                    }
                  }

                  if (orderError) {
                    return (
                      <div className='rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700'>
                        Atenção: A ordem dos eventos da timeline deve ser
                        respeitada (o evento n não pode acontecer após o evento
                        n+1).
                      </div>
                    );
                  }

                  const hasPastError = timelineDates.some(
                    (newDateStr, index) => {
                      const tpl = DEFAULT_TIMELINE_TEMPLATES[index];
                      const oldItem = event?.timeline?.find(
                        (t) => t.details === tpl?.details,
                      );
                      const oldDateStr = oldItem?.date?.slice(0, 10);
                      return newDateStr !== oldDateStr && newDateStr < todayStr;
                    },
                  );

                  if (hasPastError) {
                    return (
                      <div className='rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700'>
                        Atenção: Prazos modificados da timeline não podem estar
                        no passado.
                      </div>
                    );
                  }
                }
                return null;
              })()}

            <div className='flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={updateEventMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={updateEventMutation.isPending || !isTimelineValid}
              >
                {updateEventMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
