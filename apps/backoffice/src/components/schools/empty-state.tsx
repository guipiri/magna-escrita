import { Building2 } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  onAddSchool?: () => void;
}

export function EmptyState({ onAddSchool }: EmptyStateProps) {
  return (
    <div className='rounded-xl border border-dashed border-border bg-card p-10 text-center flex flex-col items-center justify-center'>
      <div className='size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4'>
        <Building2 className='size-5' />
      </div>
      <h3 className='font-medium text-sm text-foreground mb-1'>
        Nenhuma unidade encontrada
      </h3>
      <p className='text-muted-foreground text-sm text-center max-w-sm mb-6'>
        Parece que você ainda não tem unidades escolares cadastradas. Comece
        adicionando sua primeira unidade!
      </p>
      {onAddSchool && (
        <Button onClick={onAddSchool}>
          <Building2 className='size-4 mr-2' />
          Adicionar Unidade
        </Button>
      )}
    </div>
  );
}
