import { Building2 } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  onAddSchool?: () => void;
}

export function EmptyState({ onAddSchool }: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-16 px-4'>
      <div className='w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4'>
        <Building2 className='w-10 h-10 text-muted-foreground' />
      </div>
      <h3 className='font-semibold text-lg text-foreground mb-2'>
        Nenhuma unidade encontrada
      </h3>
      <p className='text-muted-foreground text-sm text-center max-w-md mb-6'>
        Parece que você ainda não tem unidades escolares cadastradas. Comece
        adicionando sua primeira unidade!
      </p>
      <Button onClick={onAddSchool}>
        <Building2 className='w-4 h-4' />
        Adicionar Unidade
      </Button>
    </div>
  );
}
