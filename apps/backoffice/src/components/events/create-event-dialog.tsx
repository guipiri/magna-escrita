import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { CalendarDays } from 'lucide-react';
import type { SchoolYear, SchoolYearOption } from '@repo/shared';
import { createEvent } from '../../services/events-service';
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

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface UnitOption {
  id: string;
  name: string | null;
  schoolName: string;
}

const todayValue = () => new Date().toISOString().slice(0, 10);

const DEFAULT_TIMELINE_OFFSETS = [70, 56, 56, 42, 42, 28, 28, 14, 14, 1, 0];
const TIMELINE_LABELS = [
  'Início do período para realização da atividade em sala de aula (70 dias antes)',
  'Prazo final para realização da atividade em sala de aula (56 dias antes)',
  'Início do período para upload das folhas e revisão da escola na plataforma (56 dias antes)',
  'Prazo final para upload das folhas e revisão da escola na plataforma (42 dias antes)',
  'Início da revisão da Magna (42 dias antes)',
  'Prazo para Magna finalizar revisão dos livros na plataforma (28 dias antes)',
  'Início das vendas (28 dias antes)',
  'Fim das vendas (14 dias antes)',
  'Início da produção (14 dias antes)',
  'Fim da produção (1 dia antes)',
  'Dia do autógrafo na escola (dia do evento)',
];

function calculateTimelineDate(baseDateStr: string, offsetDays: number): string {
  const baseDate = new Date(`${baseDateStr}T12:00:00`);
  const calcDate = new Date(baseDate.getTime());
  calcDate.setDate(calcDate.getDate() - offsetDays);
  
  const year = calcDate.getFullYear();
  const month = String(calcDate.getMonth() + 1).padStart(2, '0');
  const day = String(calcDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CreateEventDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateEventDialogProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayValue());
  const [schoolYear, setSchoolYear] = useState<SchoolYear | ''>('');
  const [unitId, setUnitId] = useState('');
  const [useDefaultTimeline, setUseDefaultTimeline] = useState(true);
  const [timelineDates, setTimelineDates] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: schoolUnits, isLoading: isUnitsLoading } = useQuery({
    queryKey: ['school-units'],
    queryFn: getSchoolUnits,
    enabled: isOpen,
  });

  const { data: schoolYears } = useQuery<SchoolYearOption[]>({
    queryKey: ['school-years'],
    queryFn: getSchoolYears,
    enabled: isOpen,
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
    const newDates = DEFAULT_TIMELINE_OFFSETS.map((offset) =>
      calculateTimelineDate(date, offset),
    );
    setTimelineDates(newDates);
  }, [date]);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDate(todayValue());
      setSchoolYear('');
      setUnitId('');
      setUseDefaultTimeline(true);
      return;
    }

    if (!schoolYear && schoolYears?.[0]) {
      setSchoolYear(schoolYears[0].value);
    }

    if (!unitId && units[0]) {
      setUnitId(units[0].id);
    }
  }, [isOpen, schoolYear, schoolYears, unitId, units]);

  const isTimelineValid = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    if (useDefaultTimeline) {
      if (!date) return false;
      const firstDateStr = calculateTimelineDate(date, DEFAULT_TIMELINE_OFFSETS[0] || 70);
      if (firstDateStr < todayStr) return false;
      return true;
    }

    if (timelineDates.length !== 11) return false;

    // Check chronological order
    for (let i = 0; i < timelineDates.length - 1; i++) {
      if (!timelineDates[i] || !timelineDates[i + 1]) return false;
      if (timelineDates[i] > timelineDates[i + 1]) {
        return false;
      }
    }

    // Check if the oldest date (index 0) is before today
    if (timelineDates[0] && timelineDates[0] < todayStr) {
      return false;
    }

    return true;
  }, [useDefaultTimeline, timelineDates, date]);

  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      enqueueSnackbar('Evento criado com sucesso!', { variant: 'success' });
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !date || !schoolYear || !unitId || !isTimelineValid) {
      return;
    }

    const isoTimelineDates = timelineDates.map((d) =>
      new Date(`${d}T12:00:00`).toISOString(),
    );

    createEventMutation.mutate({
      name: name.trim(),
      date: new Date(`${date}T12:00:00`).toISOString(),
      schoolYear,
      unitId,
      useDefaultTimeline,
      timelineDates: useDefaultTimeline ? undefined : isoTimelineDates,
    });
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
  };

  const isLoading = isUnitsLoading;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto' aria-describedby={undefined}>
        <DialogHeader className='flex flex-row items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <CalendarDays className='size-5' />
          </div>
          <div>
            <DialogTitle>Criar evento</DialogTitle>
            <p className='text-sm text-muted-foreground'>
              Vincule uma unidade e defina a data do evento.
            </p>
          </div>
        </DialogHeader>

        {createEventMutation.isError ? (
          <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {getErrorMessage(createEventMutation.error) ||
              'Erro ao criar evento. Tente novamente.'}
          </div>
        ) : null}

        {isLoading ? (
          <div className='rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground'>
            Carregando opções do evento...
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
                  onChange={(event) => setName(event.target.value)}
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
                  onChange={(event) => setDate(event.target.value)}
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
                <Select value={unitId} onValueChange={setUnitId}>
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
                    Datas da Timeline Personalizada
                  </h3>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    Defina as datas para cada evento na ordem cronológica de cima para baixo.
                  </p>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  {TIMELINE_LABELS.map((label, index) => {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    const isOrderError =
                      index > 0 &&
                      timelineDates[index] &&
                      timelineDates[index - 1] &&
                      timelineDates[index] < timelineDates[index - 1];
                    const isPastError =
                      index === 0 &&
                      timelineDates[index] &&
                      timelineDates[index] < todayStr;
                    const isError = isOrderError || isPastError;

                    return (
                      <div key={index} className='space-y-1'>
                        <label
                          className='text-xs font-medium text-muted-foreground block truncate'
                          title={label}
                        >
                          {index + 1}. {label}
                        </label>
                        <Input
                          type='date'
                          value={timelineDates[index] || ''}
                          onChange={(e) => {
                            const newDates = [...timelineDates];
                            newDates[index] = e.target.value;
                            setTimelineDates(newDates);
                          }}
                          className={isError ? 'border-destructive focus-visible:ring-destructive' : ''}
                        />
                        {isError && (
                          <p className='text-[10px] text-destructive'>
                            {isPastError
                              ? 'A data inicial não pode estar no passado.'
                              : 'A data não pode ser anterior ao evento anterior.'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isTimelineValid && (() => {
              const todayStr = new Date().toISOString().slice(0, 10);

              if (useDefaultTimeline) {
                const firstDateStr = calculateTimelineDate(date, DEFAULT_TIMELINE_OFFSETS[0] || 70);
                if (firstDateStr < todayStr) {
                  return (
                    <div className='rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700'>
                      Atenção: A data do evento deve ser pelo menos 70 dias no futuro para usar os prazos padrão. Atualmente, o primeiro prazo cairia em {firstDateStr} (no passado). Escolha uma data posterior ou desmarque "Usar prazos padrão" para personalizar.
                    </div>
                  );
                }
              } else {
                let orderError = false;
                for (let i = 0; i < timelineDates.length - 1; i++) {
                  if (timelineDates[i] && timelineDates[i + 1] && timelineDates[i] > timelineDates[i + 1]) {
                    orderError = true;
                    break;
                  }
                }

                if (orderError) {
                  return (
                    <div className='rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700'>
                      Atenção: A ordem dos eventos da timeline deve ser respeitada (o evento n não pode acontecer após o evento n+1).
                    </div>
                  );
                }

                if (timelineDates[0] && timelineDates[0] < todayStr) {
                  return (
                    <div className='rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700'>
                      Atenção: O primeiro prazo da timeline ({timelineDates[0]}) não pode estar no passado. O evento mais antigo deve ser hoje ou no futuro.
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
                disabled={createEventMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={createEventMutation.isPending || !isTimelineValid}
              >
                {createEventMutation.isPending ? 'Criando...' : 'Criar evento'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

