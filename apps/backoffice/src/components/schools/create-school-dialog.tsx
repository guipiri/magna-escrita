import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { createSchool } from '../../services/schools-service';
import { getErrorMessage } from '../../services/error-messages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Plus, Trash2, Building2 } from 'lucide-react';

interface UnitInput {
  tempId: string;
  name: string;
}

let tempIdCounter = 0;
const nextTempId = () => `new_${++tempIdCounter}`;

export function CreateSchoolDialog({
  onClose,
  isOpen,
  onSuccess,
}: {
  onClose?: () => void;
  isOpen: boolean;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [units, setUnits] = useState<UnitInput[]>([
    { tempId: nextTempId(), name: '' },
  ]);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const createSchoolMutation = useMutation({
    mutationFn: createSchool,
    onSuccess: () => {
      setName('');
      setUnits([{ tempId: nextTempId(), name: '' }]);
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      enqueueSnackbar('Unidade(s) criada(s) com sucesso!', {
        variant: 'success',
      });
      if (onSuccess) onSuccess();
    },
  });

  const addUnit = () => {
    setUnits((prev) => [...prev, { tempId: nextTempId(), name: '' }]);
  };

  const removeUnit = (tempId: string) => {
    setUnits((prev) => prev.filter((u) => u.tempId !== tempId));
  };

  const updateUnitName = (tempId: string, name: string) => {
    setUnits((prev) =>
      prev.map((u) => (u.tempId === tempId ? { ...u, name } : u)),
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const unitNames = units
      .map((u) => u.name.trim())
      .filter((u) => u.length > 0);

    if (unitNames.length === 0) return;

    createSchoolMutation.mutate({ name, unitNames });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader className='flex flex-row items-center'>
          <DialogTitle>Criar Unidade Escolar</DialogTitle>
        </DialogHeader>
        <div className='max-w-lg'>
          {createSchoolMutation.isError && (
            <Alert variant='destructive' className='mb-6'>
              <AlertCircle className='size-4' />
              <AlertDescription>
                {getErrorMessage(createSchoolMutation.error) ||
                  'Erro ao criar unidade escolar. Tente novamente.'}
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
                <label className='block text-sm font-medium text-foreground'>Unidades</label>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={addUnit}
                  className='text-primary hover:text-primary'
                >
                  <Plus className='size-4 mr-1' />
                  Adicionar
                </Button>
              </div>
              <div className='space-y-2 max-h-60 overflow-y-auto'>
                {units.map((unit) => (
                  <div key={unit.tempId} className='flex gap-2 items-center'>
                    <Input
                      type='text'
                      value={unit.name}
                      onChange={(e) =>
                        updateUnitName(unit.tempId, e.target.value)
                      }
                      placeholder='Nome da unidade'
                      required
                      className='flex-1 text-sm'
                    />
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
                  </div>
                ))}
              </div>
            </div>

            <div className='flex justify-end gap-2 mt-6'>
              <Button variant='outline' type='button' onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={createSchoolMutation.isPending}
              >
                <Building2 className='size-4 mr-2' />
                {createSchoolMutation.isPending
                  ? 'Criando...'
                  : 'Criar Unidade'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
