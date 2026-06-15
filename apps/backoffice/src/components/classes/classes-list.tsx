import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/auth-hook';
import {
  BookOpen,
  Edit,
  Eye,
  FileDown,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  DataList,
  DataListActions,
  DataListContent,
  DataListDescription,
  DataListFooter,
  DataListHeader,
  DataListItem,
  DataListMeta,
  DataListTitle,
} from '../ui/data-list';
import { ClassesEmptyState } from './empty-state';
import { downloadClassPdf } from '../../services/classes-service';
import { useSnackbar } from 'notistack';
import { getErrorMessage } from '../../services/error-messages';

export interface ClassData {
  id: string;
  name: string;
  teacher: string;
  bookTemplateName: string;
  bookTemplateId: string;
  studentCount: number;
  bookCount: number;
  booksCompleted: number;
  booksRevisedBySchool: number;
  schoolYear: string;
  schoolName: string;
}

interface ClassesListProps {
  classes: ClassData[];
  onView?: (classId: string) => void;
  onEdit?: (classId: string) => void;
  onDelete?: (classId: string) => void;
  onAddClass?: () => void;
}

function getProgressPercentage(classData: ClassData) {
  if (classData.bookCount === 0) return 0;
  return Math.round((classData.booksCompleted / classData.studentCount) * 100);
}

function getRevisedProgressPercentage(classData: ClassData) {
  if (classData.studentCount === 0) return 0;
  return Math.round(
    (classData.booksRevisedBySchool / classData.studentCount) * 100,
  );
}

export function ClassesList({
  classes,
  onView,
  onEdit,
  onDelete,
  onAddClass,
}: ClassesListProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const pdfMutation = useMutation({
    mutationFn: downloadClassPdf,
    onError: (error) => {
      const message = getErrorMessage(error);
      console.log(message);

      enqueueSnackbar(message, { variant: 'error' });
    },
    onSuccess: () => {
      enqueueSnackbar('PDF gerado com sucesso!', { variant: 'success' });
    },
  });

  if (classes.length === 0) {
    return <ClassesEmptyState onAddClass={onAddClass} />;
  }

  return (
    <DataList>
      {classes.map((classItem) => {
        const progress = getProgressPercentage(classItem);
        const progressRevised = getRevisedProgressPercentage(classItem);

        return (
          <DataListItem key={classItem.id}>
            <DataListHeader className='items-start flex mb-4'>
              <div className=''>
                <div className='flex flex-wrap items-center gap-2'>
                  <DataListTitle className='truncate'>
                    {classItem.name}
                  </DataListTitle>
                  <DataListDescription>
                    {classItem.schoolName}
                  </DataListDescription>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className='h-fit'
                    variant='ghost'
                    size='icon'
                    aria-label='Ações da turma'
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuItem onClick={() => onView?.(classItem.id)}>
                    <Eye className='h-4 w-4' />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(classItem.id)}>
                    <Edit className='h-4 w-4' />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(classItem.id)}
                    className='text-destructive focus:text-destructive'
                  >
                    <Trash2 className='h-4 w-4' />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </DataListHeader>

            <DataListContent className='sm:grid-cols-3'>
              <div className='rounded-xl border border-border/70 bg-muted/20 p-3'>
                <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                  <Users className='h-4 w-4' />
                  <span className='text-xs font-medium uppercase tracking-wide'>
                    Alunos
                  </span>
                </div>
                <p className='text-lg font-semibold text-foreground'>
                  {classItem.studentCount}
                </p>
              </div>

              <div className='rounded-xl border border-border/70 bg-muted/20 p-3'>
                <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                  <BookOpen className='h-4 w-4' />
                  <span className='text-xs font-medium uppercase tracking-wide'>
                    Livros
                  </span>
                </div>
                <p className='text-lg font-semibold text-foreground'>
                  {classItem.bookCount}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {classItem.booksCompleted} concluídos de{' '}
                  {classItem.studentCount} livros no total
                </p>
              </div>

              <div className='rounded-xl border border-border/70 bg-muted/20 p-3'>
                <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                  <GraduationCap className='h-4 w-4' />
                  <span className='text-xs font-medium uppercase tracking-wide'>
                    Progresso
                  </span>
                </div>
                <div className='space-y-3 mt-2'>
                  <div>
                    <div className='h-2 overflow-hidden rounded-full bg-background'>
                      <div
                        className='h-full rounded-full bg-linear-to-r from-emerald-500 to-green-500 transition-all duration-300'
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className='mt-1 text-xs font-medium text-muted-foreground'>
                      {progress}% concluído
                    </p>
                  </div>
                  {isAdmin && (
                    <div>
                      <div className='h-2 overflow-hidden rounded-full bg-background'>
                        <div
                          className='h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-300'
                          style={{ width: `${progressRevised}%` }}
                        />
                      </div>
                      <p className='mt-1 text-xs font-medium text-muted-foreground'>
                        {progressRevised}% revisado pela escola
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DataListContent>

            <DataListFooter>
              <DataListMeta>
                <span className='inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground'>
                  {classItem.schoolYear.replace('YEAR_', '')}
                </span>
                <span className='inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground'>
                  Profª {classItem.teacher}
                </span>
                <span className='inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground'>
                  Modelo: {classItem.bookTemplateName}
                </span>
              </DataListMeta>

              <DataListActions>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={pdfMutation.isPending}
                  onClick={() => pdfMutation.mutate(classItem.id)}
                  aria-label={`Baixar PDF da turma ${classItem.name}`}
                >
                  {pdfMutation.isPending &&
                  pdfMutation.variables === classItem.id ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <FileDown className='h-4 w-4' />
                  )}
                  {pdfMutation.isPending &&
                  pdfMutation.variables === classItem.id
                    ? 'Gerando...'
                    : 'Baixar PDF'}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onView?.(classItem.id)}
                >
                  Ver Livros
                </Button>
              </DataListActions>
            </DataListFooter>
          </DataListItem>
        );
      })}
    </DataList>
  );
}
