import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Search, Coins, Plus, ChevronDown, ChevronUp, Loader2, RotateCw } from 'lucide-react';
import { getPrices } from '../services/prices-service';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { CreatePriceDialog } from '../components/prices/create-price-dialog';
import { EditPriceDialog } from '../components/prices/edit-price-dialog';
import { GetPricesResponse } from '@repo/shared';
import { AnimatePresence, motion } from 'motion/react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

function PriceCard({
  price,
  onEdit,
}: {
  price: GetPricesResponse;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className='rounded-xl border border-border bg-card shadow-sm overflow-hidden'>
      <div
        role='button'
        tabIndex={0}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className='w-full cursor-pointer text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-accent/50 transition-colors'
      >
        <div className='flex items-center gap-3 min-w-0 w-full'>
          <span className='shrink-0 w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center'>
            <Coins className='w-4 h-4 text-violet-600' />
          </span>
          <div className='min-w-0 space-y-1 w-full'>
            <p className='font-medium text-foreground truncate'>
              {price.name || 'Sem nome'}
            </p>
            <p className='text-xs text-muted-foreground font-mono truncate'>
              ID: {price.id}
            </p>
            {price.classes.length > 0 ? (
              <div className='flex flex-wrap gap-1 mt-1.5'>
                {price.classes.map((cls) => (
                  <span
                    key={cls.id}
                    className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border/30'
                  >
                    {cls.schoolName} - {cls.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className='text-xs text-muted-foreground mt-1'>
                Nenhuma unidade associada
              </p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className='px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-card text-foreground hover:bg-accent transition-colors'
          >
            Editar
          </button>
          {expanded ? (
            <ChevronUp className='w-4 h-4 text-muted-foreground shrink-0' />
          ) : (
            <ChevronDown className='w-4 h-4 text-muted-foreground shrink-0' />
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key='tiers'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='overflow-hidden'
          >
            <div className='px-5 pb-4 border-t border-border'>
              <div className='mt-3 overflow-x-auto rounded-lg border border-border bg-muted/10'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-muted/60 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border'>
                      <th className='px-4 py-2 text-left w-32'>
                        Quantidade Mínima
                      </th>
                      <th className='px-4 py-2 text-left'>
                        Preço por Unidade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {price.tiers.map((tier) => (
                      <tr
                        key={tier.id}
                        className='border-t border-border/60 hover:bg-muted/30 transition-colors'
                      >
                        <td className='px-4 py-2.5 font-mono text-sm text-muted-foreground'>
                          {tier.minQuantity}+
                        </td>
                        <td className='px-4 py-2.5 font-semibold text-foreground'>
                          {formatCurrency(tier.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PricesPage() {
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<GetPricesResponse | null>(null);

  const {
    data: prices,
    isLoading,
    error,
    refetch,
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
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm'>
            <Loader2 className='size-5 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Carregando preços...</p>
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
              Erro ao carregar os preços. Tente novamente mais tarde.
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
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6'>
        
        {/* Header */}
        <section className='rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6'>
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

        {/* Prices List Accordion */}
        {filteredPrices.length === 0 ? (
          <div className='rounded-xl border border-border bg-card p-10 text-center shadow-sm'>
            <Coins className='w-9 h-9 text-muted-foreground mx-auto mb-3' />
            <p className='text-sm text-muted-foreground'>
              Nenhum preço correspondente encontrado.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredPrices.map((price) => (
              <PriceCard
                key={price.id}
                price={price}
                onEdit={() => setEditingPrice(price)}
              />
            ))}
          </div>
        )}
      </div>

      <CreatePriceDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      {editingPrice && (
        <EditPriceDialog
          isOpen={!!editingPrice}
          price={editingPrice}
          onClose={() => setEditingPrice(null)}
        />
      )}
    </main>
  );
}
