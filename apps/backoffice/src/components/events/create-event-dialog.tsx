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

export function CreateEventDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateEventDialogProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayValue());
  const [schoolYear, setSchoolYear] = useState<SchoolYear | ''>('');
  const [unitId, setUnitId] = useState('');
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
    if (!isOpen) {
      setName('');
      setDate(todayValue());
      setSchoolYear('');
      setUnitId('');
      return;
    }

    if (!schoolYear && schoolYears?.[0]) {
      setSchoolYear(schoolYears[0].value);
    }

    if (!unitId && units[0]) {
      setUnitId(units[0].id);
    }
  }, [isOpen, schoolYear, schoolYears, unitId, units]);

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

    if (!name.trim() || !date || !schoolYear || !unitId) {
      return;
    }

    createEventMutation.mutate({
      name: name.trim(),
      date: new Date(`${date}T12:00:00`).toISOString(),
      schoolYear,
      unitId,
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
      <DialogContent className='sm:max-w-4xl' aria-describedby={undefined}>
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

            <div className='flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={createEventMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={createEventMutation.isPending}>
                {createEventMutation.isPending ? 'Criando...' : 'Criar evento'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
