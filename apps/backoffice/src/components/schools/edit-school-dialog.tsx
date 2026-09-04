import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { getSchoolById, updateSchool } from '../../services/schools-service';
import { getErrorMessage } from '../../services/error-messages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { AlertCircle, Plus, Trash2, Building2, Loader2, Info } from 'lucide-react';

interface UnitFormItem {
  id?: string;
  tempId: string;
  name: string;
  hasAssociatedEntities: boolean;
  classesCount?: number;
  eventsCount?: number;
  usersCount?: number;
}

let tempIdCounter = 0;
const nextTempId = () => `edit_new_${++tempIdCounter}`;

export function EditSchoolDialog({
  schoolId,
  isOpen,
  onClose,
  onSuccess,
}: {
  schoolId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [units, setUnits] = useState<UnitFormItem[]>([]);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    data: schoolDetail,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useQuery({
    queryKey: ['schools', schoolId],
    queryFn: () => getSchoolById(schoolId!),
    enabled: isOpen && !!schoolId,
  });

  useEffect(() => {
    if (schoolDetail) {
      setName(schoolDetail.name);
      setUnits(
        schoolDetail.units.map((u) => ({
          id: u.id,
          tempId: u.id,
          name: u.name ?? '',
          hasAssociatedEntities: u.hasAssociatedEntities,
          classesCount: u.classesCount,
          eventsCount: u.eventsCount,
          usersCount: u.usersCount,
        })),
      );
    }
  }, [schoolDetail]);

  const updateMutation = useMutation({
    mutationFn: updateSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      enqueueSnackbar('Escola atualizada com sucesso!', {
        variant: 'success',
      });
      onSuccess?.();
      onClose();
    },
  });

  const addUnit = () => {
    setUnits((prev) => [
      ...prev,
      {
        tempId: nextTempId(),
        name: '',
        hasAssociatedEntities: false,
      },
    ]);
  };

  const removeUnit = (tempId: string) => {
    setUnits((prev) => prev.filter((u) => u.tempId !== tempId));
  };

  const updateUnitName = (tempId: string, value: string) => {
    setUnits((prev) =>
      prev.map((u) => (u.tempId === tempId ? { ...u, name: value } : u)),
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!schoolId) return;

    const trimmedName = name.trim();
    if (!trimmedName) return;

    const validUnits = units
      .map((u) => ({
        id: u.id,
        name: u.name.trim(),
      }))
      .filter((u) => u.name.length > 0);

    if (validUnits.length === 0) {
      enqueueSnackbar('A escola deve possuir pelo menos uma unidade.', {
        variant: 'error',
      });
      return;
    }

    updateMutation.mutate({
      id: schoolId,
      data: {
        name: trimmedName,
        units: validUnits,
      },
    });
  };

  const hasUnremovableUnits = units.some((u) => u.hasAssociatedEntities);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader className='flex flex-row items-center'>
          <DialogTitle>Editar Escola</DialogTitle>
        </DialogHeader>

        {isLoadingDetail ? (
          <div className='flex items-center justify-center p-10'>
            <Loader2 className='size-6 animate-spin text-primary' />
          </div>
        ) : detailError ? (
          <Alert variant='destructive' className='mb-4'>
            <AlertCircle className='size-4' />
            <AlertDescription>
              {getErrorMessage(detailError) || 'Erro ao carregar dados da escola.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className='max-w-lg'>
            {updateMutation.isError && (
              <Alert variant='destructive' className='mb-6'>
                <AlertCircle className='size-4' />
                <AlertDescription>
                  {getErrorMessage(updateMutation.error) ||
                    'Erro ao atualizar escola. Tente novamente.'}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>
                  Nome da Escola
                </label>
                <Input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Ex: EMEF Professor João Silva'
                  required
                />
              </div>

              <div>
                <div className='flex items-center justify-between mb-1'>
                  <label className='block text-sm font-medium text-foreground'>
                    Unidades
                  </label>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={addUnit}
                    className='text-primary hover:text-primary'
                  >
                    <Plus className='size-4 mr-1' />
                    Adicionar Unidade
                  </Button>
                </div>

                <div className='space-y-2 max-h-60 overflow-y-auto pr-1'>
                  {units.map((unit) => {
                    const isLocked = unit.hasAssociatedEntities;

                    return (
                      <div
                        key={unit.tempId}
                        className='flex gap-2 items-center rounded-lg border border-border/70 bg-muted/20 p-2'
                      >
                        <Input
                          type='text'
                          value={unit.name}
                          onChange={(e) =>
                            updateUnitName(unit.tempId, e.target.value)
                          }
                          placeholder='Nome da unidade'
                          required
                          className='flex-1 text-sm bg-input-background'
                        />

                        {isLocked ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  disabled
                                  className='text-muted-foreground opacity-50 cursor-not-allowed'
                                  aria-label='Unidade vinculada a entidades não pode ser removida'
                                >
                                  <Trash2 className='size-4' />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Esta unidade possui turmas, eventos ou usuários vinculados e não pode ser excluída.
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() => removeUnit(unit.tempId)}
                            className='text-destructive hover:text-destructive hover:bg-destructive/10'
                            aria-label='Remover unidade'
                          >
                            <Trash2 className='size-4' />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {hasUnremovableUnits && (
                  <p className='mt-2 flex items-center gap-1.5 text-xs text-muted-foreground'>
                    <Info className='size-3.5 shrink-0' />
                    Unidades com turmas, eventos ou usuários vinculados não podem ser removidas.
                  </p>
                )}
              </div>

              <div className='flex justify-end gap-2 mt-6'>
                <Button variant='outline' type='button' onClick={onClose}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={updateMutation.isPending}>
                  <Building2 className='size-4 mr-2' />
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
