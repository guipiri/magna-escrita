import { GraduationCap } from 'lucide-react';
import { Button } from '../ui/button';

interface ClassesEmptyStateProps {
  onAddClass?: () => void;
}

export function ClassesEmptyState({ onAddClass }: ClassesEmptyStateProps) {
  return (
    <div className='rounded-xl border border-dashed border-border bg-card p-10 text-center'>
      <div className='mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
        <GraduationCap className='size-5' />
      </div>
      <p className='text-sm font-medium text-foreground'>
        Nenhuma turma encontrada
      </p>
      <p className='mt-1 text-sm text-muted-foreground max-w-md mx-auto'>
        Comece criando turmas para organizar os alunos e seus livros.
      </p>
      {onAddClass && (
        <div className='mt-6'>
          <Button onClick={onAddClass} className='gap-2'>
            <GraduationCap className='size-4' />
            Adicionar Turma
          </Button>
        </div>
      )}
    </div>
  );
}
