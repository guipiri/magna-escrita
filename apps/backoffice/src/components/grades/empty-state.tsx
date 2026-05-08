import { GraduationCap } from 'lucide-react';
import { Button } from '../ui/button';

interface ClassesEmptyStateProps {
  onAddClass?: () => void;
}

export function ClassesEmptyState({ onAddClass }: ClassesEmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-md bg-muted/20'>
      <div className='w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4'>
        <GraduationCap className='w-10 h-10 text-muted-foreground' />
      </div>
      <h3 className='font-semibold text-lg text-foreground mb-2'>
        Nenhuma turma encontrada
      </h3>
      <p className='text-muted-foreground text-sm text-center max-w-md mb-6'>
        Comece criando turmas para organizar os alunos e seus livros. Você pode
        adicionar professores, turnos e muito mais.
      </p>
      <Button onClick={onAddClass}>
        <GraduationCap className='w-4 h-4' />
        Adicionar Turma
      </Button>
    </div>
  );
}
