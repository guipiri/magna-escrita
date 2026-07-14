import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Search, Coins, AlertCircle, Plus, Pencil } from 'lucide-react';
import { getPrices } from '../services/prices-service';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CreatePriceDialog } from '../components/prices/create-price-dialog';
import { EditPriceDialog } from '../components/prices/edit-price-dialog';
import { GetPricesResponse } from '@repo/shared';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function PricesPage() {
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<GetPricesResponse | null>(null);

  const {
    data: prices,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['prices'],
    queryFn: getPrices,
  });

  const filteredPrices = useMemo(() => {
    if (!prices) return [];
    const term = search.trim().toLowerCase();
    if (!term) return prices;

    return prices.filter((price) => {
      const priceName = (price.name || price.id).toLowerCase();
      const classesMatch = price.classes.some((c) =>
        `${c.name} ${c.schoolName} ${c.unitName || ''}`
          .toLowerCase()
          .includes(term)
      );
      return priceName.includes(term) || classesMatch;
    });
  }, [prices, search]);

  if (isLoading) {
    return (
      <main className='flex-1 overflow-auto bg-background/95'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='rounded-3xl border border-border bg-card p-6 shadow-sm'>
            <p className='text-sm text-muted-foreground'>
              Carregando preços...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='flex-1 overflow-auto bg-background/95'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm'>
            <p className='text-sm text-red-600 flex items-center gap-2'>
              <AlertCircle className='w-4 h-4' />
              Erro ao carregar os preços. Tente novamente mais tarde.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 overflow-auto bg-background/95'>
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6'>
        
        {/* Header */}
        <section className='rounded-3xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6'>
          <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-2'>
              <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl flex items-center gap-2'>
                <Coins className='w-8 h-8 text-primary' />
                Preços
              </h1>
              <p className='mt-2 text-sm text-muted-foreground'>
                Visualize e gerencie os preços, as faixas de descontos por volume e as turmas associadas a cada um.
              </p>
            </div>

            <div className='flex w-full flex-col gap-3 sm:max-w-md'>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  type='search'
                  placeholder='Buscar por nome do preço ou turma...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-9'
                />
              </div>

              <Button
                onClick={() => setCreateDialogOpen(true)}
                className='w-full sm:w-auto sm:self-end flex items-center justify-center gap-1.5'
              >
                <Plus className='w-4 h-4' />
                Adicionar Preço
              </Button>
            </div>
          </div>
        </section>

        {/* Prices List Table */}
        <div className='rounded-3xl border border-border bg-card shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  <th className='p-4 pl-6 w-1/4'>Preço</th>
                  <th className='p-4 w-1/3'>Faixas de Preço (Tiers)</th>
                  <th className='p-4 w-5/12'>Turmas Associadas</th>
                  <th className='p-4 pr-6 text-right w-1/12'>Ações</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60 text-sm'>
                {filteredPrices.length === 0 ? (
                  <tr>
                    <td colSpan={3} className='p-8 text-center text-muted-foreground'>
                      Nenhum preço correspondente encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredPrices.map((price) => (
                    <tr key={price.id} className='hover:bg-muted/10 transition-colors'>
                      <td className='p-4 pl-6 align-top'>
                        <div className='flex flex-col gap-1'>
                          <span className='font-medium text-foreground text-base'>
                            {price.name || 'Sem nome'}
                          </span>
                          <span className='text-xs text-muted-foreground font-mono'>
                            ID: {price.id}
                          </span>
                        </div>
                      </td>
                      <td className='p-4 align-top'>
                        <div className='flex flex-col gap-2'>
                          {price.tiers.map((tier) => (
                            <div key={tier.id} className='flex items-center gap-2 text-xs'>
                              <Badge variant='outline' className='bg-primary/5 border-primary/20 text-primary px-2.5 py-0.5 rounded-md font-medium shrink-0'>
                                Min. Qtd: {tier.minQuantity}
                              </Badge>
                              <span className='font-semibold text-foreground text-sm'>
                                {formatCurrency(tier.unitPrice)}
                              </span>
                              <span className='text-muted-foreground text-[11px]'>
                                por unidade
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className='p-4 align-top'>
                        {price.classes.length === 0 ? (
                          <span className='text-xs text-muted-foreground italic block mt-1'>
                            Nenhuma turma associada
                          </span>
                        ) : (
                          <div className='flex flex-wrap gap-2'>
                            {price.classes.map((cls) => (
                              <div
                                key={cls.id}
                                className='inline-flex flex-col px-3 py-1.5 rounded-xl bg-muted border border-border/80 text-muted-foreground max-w-xs'
                              >
                                <span className='text-xs font-semibold text-foreground leading-normal'>
                                  {cls.name}
                                </span>
                                <span className='text-[10px] text-muted-foreground leading-normal mt-0.5'>
                                  {cls.schoolName} {cls.unitName ? `- ${cls.unitName}` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className='p-4 pr-6 align-top text-right'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setEditingPrice(price)}
                          className='h-8 w-8 text-muted-foreground hover:text-foreground'
                        >
                          <Pencil className='w-4 h-4' />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreatePriceDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      <EditPriceDialog
        isOpen={!!editingPrice}
        price={editingPrice}
        onClose={() => setEditingPrice(null)}
      />
    </main>
  );
}
