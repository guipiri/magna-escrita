import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState, useMemo, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { Plus, Trash2, AlertCircle, Search } from 'lucide-react';
import { getErrorMessage } from '../../services/error-messages';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { getClasses } from '../../services/classes-service';
import { updatePrice } from '../../services/prices-service';
import { CreatePriceTierRequest, GetPricesResponse } from '@repo/shared';

export function EditPriceDialog({
  isOpen,
  onClose,
  price,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  price: GetPricesResponse | null;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [tiers, setTiers] = useState<CreatePriceTierRequest[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classSearch, setClassSearch] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (price && isOpen) {
      setName(price.name || '');
      setTiers(
        price.tiers.map((t) => ({
          minQuantity: t.minQuantity,
          unitPrice: t.unitPrice,
        }))
      );
      setSelectedClassIds(price.classes.map((c) => c.id));
      setClassSearch('');
      setValidationError(null);
    }
  }, [price, isOpen]);

  const { data: classesList, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
    enabled: isOpen,
  });

  const filteredClasses = useMemo(() => {
    if (!classesList) return [];
    const term = classSearch.toLowerCase().trim();
    if (!term) return classesList;
    return classesList.filter((c) =>
      `${c.name} ${c.school.name} ${c.unit.name || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [classesList, classSearch]);

  const addTier = () => {
    setTiers([...tiers, { minQuantity: 1, unitPrice: 0 }]);
    setValidationError(null);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
    setValidationError(null);
  };

  const updateTierField = (
    index: number,
    field: keyof CreatePriceTierRequest,
    value: number
  ) => {
    const updated = tiers.map((tier, i) => {
      if (i === index) {
        return { ...tier, [field]: value };
      }
      return tier;
    });
    setTiers(updated);
    setValidationError(null);
  };

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePrice(id, data),
    onSuccess: (data) => {
      enqueueSnackbar(
        `Preço "${data.name || data.id}" atualizado com sucesso!`,
        { variant: 'success' }
      );
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!price) return;

    if (!name.trim()) {
      setValidationError('Nome do preço é obrigatório.');
      return;
    }

    if (tiers.length === 0) {
      setValidationError('Adicione pelo menos uma faixa de preço (tier).');
      return;
    }

    const quantities = tiers.map((t) => t.minQuantity);
    const uniqueQuantities = new Set(quantities);
    if (uniqueQuantities.size !== quantities.length) {
      setValidationError('Existem faixas com quantidade mínima duplicada.');
      return;
    }

    for (const tier of tiers) {
      if (tier.minQuantity < 1) {
        setValidationError('A quantidade mínima deve ser de pelo menos 1.');
        return;
      }
      if (tier.unitPrice < 0.01) {
        setValidationError('O preço unitário deve ser maior que zero.');
        return;
      }
    }

    setValidationError(null);

    editMutation.mutate({
      id: price.id,
      data: {
        name,
        tiers,
        classIds: selectedClassIds,
      },
    });
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Editar Tabela de Preço</DialogTitle>
        </DialogHeader>

        {(validationError || editMutation.isError) && (
          <div className='p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm flex items-start gap-2'>
            <AlertCircle className='w-4 h-4 shrink-0 mt-0.5' />
            <div>
              {validationError ||
                getErrorMessage(editMutation.error) ||
                'Ocorreu um erro ao atualizar a tabela de preço.'}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Price Name */}
          <div className='space-y-1.5'>
            <label className='text-sm font-semibold text-foreground'>
              Nome da Tabela de Preço
            </label>
            <Input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex: Tabela de Preço Escolas Públicas'
              required
              disabled={editMutation.isPending}
            />
          </div>

          {/* Pricing Tiers */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between border-b border-border pb-2'>
              <label className='text-sm font-semibold text-foreground'>
                Faixas de Preço (Tiers)
              </label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addTier}
                disabled={editMutation.isPending}
                className='text-xs flex items-center gap-1'
              >
                <Plus className='w-3.5 h-3.5' />
                Adicionar Faixa
              </Button>
            </div>

            <div className='space-y-3 max-h-48 overflow-y-auto pr-1'>
              {tiers.map((tier, index) => (
                <div key={index} className='flex items-center gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/40'>
                  <div className='flex-1 flex items-center gap-2'>
                    <span className='text-xs text-muted-foreground whitespace-nowrap'>Qtd Mínima:</span>
                    <Input
                      type='number'
                      min='1'
                      value={tier.minQuantity}
                      onChange={(e) =>
                        updateTierField(index, 'minQuantity', parseInt(e.target.value) || 0)
                      }
                      className='h-9'
                      required
                      disabled={editMutation.isPending}
                    />
                  </div>

                  <div className='flex-1 flex items-center gap-2'>
                    <span className='text-xs text-muted-foreground whitespace-nowrap'>Preço Unitário (R$):</span>
                    <Input
                      type='number'
                      step='0.01'
                      min='0.01'
                      value={tier.unitPrice || ''}
                      onChange={(e) =>
                        updateTierField(index, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      className='h-9'
                      required
                      disabled={editMutation.isPending}
                    />
                  </div>

                  {tiers.length > 1 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => removeTier(index)}
                      disabled={editMutation.isPending}
                      className='text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Associate Classes */}
          <div className='space-y-3'>
            <label className='text-sm font-semibold text-foreground block border-b border-border pb-2'>
              Associar com Turmas
            </label>

            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Filtrar turmas por nome ou unidade...'
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className='pl-9 h-9'
                disabled={classesLoading || editMutation.isPending}
              />
            </div>

            <div className='border border-border/80 rounded-xl overflow-hidden bg-card'>
              <div className='max-h-48 overflow-y-auto divide-y divide-border/60 p-1'>
                {classesLoading ? (
                  <p className='text-xs text-muted-foreground p-4 text-center'>Carregando turmas...</p>
                ) : filteredClasses.length === 0 ? (
                  <p className='text-xs text-muted-foreground p-4 text-center'>Nenhuma turma correspondente encontrada.</p>
                ) : (
                  filteredClasses.map((c) => {
                    const isChecked = selectedClassIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        className='flex items-center gap-3 p-2.5 hover:bg-muted/30 transition-colors rounded-lg cursor-pointer'
                        onClick={() => handleClassToggle(c.id)}
                      >
                        <Checkbox
                          id={`edit-class-check-${c.id}`}
                          checked={isChecked}
                          onCheckedChange={() => handleClassToggle(c.id)}
                          disabled={editMutation.isPending}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className='flex flex-col text-xs'>
                          <span className='font-semibold text-foreground'>{c.name}</span>
                          <span className='text-muted-foreground text-[10px]'>
                            {c.school.name} {c.unit.name ? `- ${c.unit.name}` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className='pt-2 border-t border-border'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={editMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
