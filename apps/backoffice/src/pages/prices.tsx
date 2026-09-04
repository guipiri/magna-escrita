import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Search,
  Coins,
  Plus,
  Loader2,
  RotateCw,
  MoreHorizontal,
  Pencil,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { getPrices } from '../services/prices-service';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
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

function PriceItem({
  price,
  onEdit,
}: {
  price: GetPricesResponse;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const sortedTiers = useMemo(() => {
    return [...price.tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  }, [price.tiers]);

  const basePrice = sortedTiers[0]?.unitPrice;
  const bestPrice = sortedTiers[sortedTiers.length - 1]?.unitPrice;

  return (
    <DataListItem>
      <DataListHeader className='mb-4 flex items-start'>
        <div>
          <div className='flex flex-wrap items-center gap-2'>
            <DataListTitle className='truncate'>
              {price.name || 'Sem nome'}
            </DataListTitle>
            <Badge variant='secondary'>
              {price.tiers.length}{' '}
              {price.tiers.length === 1 ? 'faixa' : 'faixas'}
            </Badge>
          </div>
          <DataListDescription className='mt-0.5 font-mono text-xs'>
            ID: {price.id}
          </DataListDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className='h-8 w-8 p-0'
              variant='ghost'
              size='icon'
              aria-label='Ações do preço'
            >
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className='mr-2 h-4 w-4' />
              Editar preço
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExpanded((prev) => !prev)}>
              <Layers className='mr-2 h-4 w-4' />
              {expanded ? 'Ocultar faixas' : 'Ver faixas'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DataListHeader>

      <DataListContent className='sm:grid-cols-3'>
        <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
          <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
            <GraduationCap className='h-4 w-4' />
            <span className='text-xs font-medium uppercase tracking-wide'>
              Turmas Vinculadas
            </span>
          </div>
          <p className='text-sm font-semibold text-foreground'>
            {price.classes.length}{' '}
            {price.classes.length === 1 ? 'turma' : 'turmas'}
          </p>
          {price.classes.length > 0 ? (
            <div className='mt-1.5 flex flex-wrap gap-1 max-h-16 overflow-y-auto'>
              {price.classes.map((cls) => (
                <span
                  key={cls.id}
                  className='inline-flex items-center rounded border border-border/40 bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground'
                >
                  {cls.schoolName} - {cls.name}
                </span>
              ))}
            </div>
          ) : (
            <p className='text-xs text-muted-foreground mt-0.5'>
              Nenhuma turma vinculada
            </p>
          )}
        </div>

        <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
          <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
            <Coins className='h-4 w-4' />
            <span className='text-xs font-medium uppercase tracking-wide'>
              Preço Inicial (1 un)
            </span>
          </div>
          <p className='text-lg font-semibold text-foreground'>
            {basePrice != null ? formatCurrency(basePrice) : '—'}
          </p>
          <p className='text-xs text-muted-foreground'>
            Faixa inicial para pedidos menores
          </p>
        </div>

        <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
          <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
            <Layers className='h-4 w-4' />
            <span className='text-xs font-medium uppercase tracking-wide'>
              Maior Desconto
            </span>
          </div>
          <p className='text-lg font-semibold text-foreground'>
            {bestPrice != null ? formatCurrency(bestPrice) : '—'}
          </p>
          <button
            type='button'
            onClick={() => setExpanded((prev) => !prev)}
            className='text-xs text-primary hover:underline mt-0.5 text-left flex items-center gap-1 cursor-pointer'
          >
            {expanded ? 'Ocultar tabela de faixas' : 'Ver tabela de faixas'}
          </button>
        </div>
      </DataListContent>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key='tiers'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='overflow-hidden mt-4'
          >
            <div className='rounded-lg border border-border bg-muted/10 overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='bg-muted/60 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border'>
                    <th className='px-4 py-2 text-left w-36'>
                      Quantidade Mínima
                    </th>
                    <th className='px-4 py-2 text-left'>
                      Preço por Unidade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTiers.map((tier) => (
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
          </motion.div>
        )}
      </AnimatePresence>
    </DataListItem>
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
                placeholder='Buscar por nome do preço ou turma...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>

            <Button
              onClick={() => setCreateDialogOpen(true)}
              className='w-full md:w-auto'
            >
              <Plus className='h-4 w-4' />
              Adicionar Preço
            </Button>
          </div>
        </motion.section>

        <div className='mt-6'>
          {filteredPrices.length === 0 ? (
            <div className='rounded-xl border border-dashed border-border bg-card p-10 text-center'>
              <div className='mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <Coins className='size-5' />
              </div>
              <p className='text-sm font-medium text-foreground'>
                Nenhum preço encontrado
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Nenhum preço corresponde ao filtro atual.
              </p>
            </div>
          ) : (
            <DataList>
              {filteredPrices.map((price) => (
                <PriceItem
                  key={price.id}
                  price={price}
                  onEdit={() => setEditingPrice(price)}
                />
              ))}
            </DataList>
          )}
        </div>
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
