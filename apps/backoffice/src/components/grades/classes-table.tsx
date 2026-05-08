import {
  MoreHorizontal,
  Users,
  BookOpen,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ClassesEmptyState } from './empty-state';

export interface ClassData {
  id: string;
  name: string;
  teacher: string;
  studentCount: number;
  bookCount: number;
  booksCompleted: number;
  status: 'active' | 'in-progress' | 'completed';
  school?: string;
}

interface ClassesTableProps {
  classes: ClassData[];
  onView?: (classId: string) => void;
  onEdit?: (classId: string) => void;
  onDelete?: (classId: string) => void;
}

const statusConfig = {
  active: { label: 'Ativa', variant: 'default' as const },
  'in-progress': { label: 'Em Andamento', variant: 'outline' as const },
  completed: { label: 'Concluída', variant: 'secondary' as const },
};

export function ClassesTable({
  classes,
  onView,
  onEdit,
  onDelete,
}: ClassesTableProps) {
  const getProgressPercentage = (classData: ClassData) => {
    if (classData.bookCount === 0) return 0;
    return Math.round((classData.booksCompleted / classData.bookCount) * 100);
  };

  if (classes.length === 0) return <ClassesEmptyState />;

  return (
    <div className='rounded-md border border-border bg-card overflow-hidden shadow-sm'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/50 hover:bg-muted/50'>
            <TableHead className='font-semibold'>Turma</TableHead>
            <TableHead className='font-semibold'>Série</TableHead>
            <TableHead className='font-semibold'>Turno</TableHead>
            <TableHead className='font-semibold'>Professor(a)</TableHead>
            <TableHead className='font-semibold text-center'>Alunos</TableHead>
            <TableHead className='font-semibold text-center'>Livros</TableHead>
            <TableHead className='font-semibold text-center'>
              Progresso
            </TableHead>
            <TableHead className='font-semibold'>Status</TableHead>
            <TableHead className='w-12.5'></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((classItem) => {
            const progress = getProgressPercentage(classItem);
            const status = statusConfig[classItem.status];

            return (
              <TableRow
                key={classItem.id}
                className='cursor-pointer hover:bg-muted/30 transition-colors'
                onClick={() => onView?.(classItem.id)}
              >
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='font-medium text-foreground'>
                      {classItem.name}
                    </span>
                    {classItem.school && (
                      <span className='text-xs text-muted-foreground'>
                        {classItem.school}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className='text-sm text-foreground'>
                    {classItem.teacher}
                  </span>
                </TableCell>
                <TableCell>
                  <div className='flex items-center justify-center gap-1.5'>
                    <Users className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                    <span className='text-sm font-medium'>
                      {classItem.studentCount}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex flex-col items-center gap-0.5'>
                    <div className='flex items-center gap-1.5'>
                      <BookOpen className='w-4 h-4 text-pink-600 dark:text-pink-400' />
                      <span className='text-sm font-medium'>
                        {classItem.bookCount}
                      </span>
                    </div>
                    <span className='text-xs text-muted-foreground'>
                      {classItem.booksCompleted} concluídos
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex flex-col items-center gap-1.5'>
                    <div className='w-full max-w-25 h-2 bg-muted rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-linear-to-r from-green-500 to-emerald-500 transition-all duration-300'
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className='text-xs font-medium text-muted-foreground'>
                      {progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon'>
                        <MoreHorizontal className='w-4 h-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => onView?.(classItem.id)}>
                        <Eye className='w-4 h-4' />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(classItem.id)}>
                        <Edit className='w-4 h-4' />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(classItem.id)}
                        className='text-destructive focus:text-destructive'
                      >
                        <Trash2 className='w-4 h-4' />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
