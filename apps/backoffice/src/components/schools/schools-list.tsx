import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
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
  DataListContent,
  DataListDescription,
  DataListHeader,
  DataListItem,
  DataListTitle,
} from '../ui/data-list';
import { routes } from '../../main';

export interface SchoolData {
  id: string;
  name: string;
  classCount: number;
  studentCount: number;
  bookCount: number;
  status: 'active' | 'in-progress' | 'completed';
  lastActivity: string;
  canDelete: boolean;
}

interface SchoolsListProps {
  schools: SchoolData[];
  onAddSchool?: () => void;
  onEditSchool?: (school: SchoolData) => void;
  onDeleteSchool?: (school: SchoolData) => void;
  canManage?: boolean;
}

const statusConfig = {
  active: { label: 'Ativo', variant: 'success' as const },
  'in-progress': { label: 'Em Andamento', variant: 'warning' as const },
  completed: { label: 'Concluído', variant: 'default' as const },
};

function SchoolsEmptyState() {
  return (
    <div className='rounded-xl border border-dashed border-border bg-card p-10 text-center'>
      <div className='mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
        <Building2 className='size-5' />
      </div>
      <p className='text-sm font-medium text-foreground'>
        Nenhuma unidade encontrada
      </p>
      <p className='mt-1 text-sm text-muted-foreground'>
        Nenhuma unidade escolar corresponde ao filtro atual.
      </p>
    </div>
  );
}

export function SchoolsList({
  schools,
  onEditSchool,
  onDeleteSchool,
  canManage = true,
}: SchoolsListProps) {
  const navigate = useNavigate();

  if (schools.length === 0) {
    return <SchoolsEmptyState />;
  }

  return (
    <DataList>
      {schools.map((school) => {
        const status = statusConfig[school.status] ?? statusConfig.active;

        return (
          <DataListItem key={school.id}>
            <DataListHeader className='mb-4 flex items-start'>
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <DataListTitle className='truncate'>
                    {school.name}
                  </DataListTitle>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <DataListDescription className='mt-0.5'>
                  {school.lastActivity}
                </DataListDescription>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className='h-8 w-8 p-0'
                    variant='ghost'
                    size='icon'
                    aria-label='Ações da unidade'
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuItem onClick={() => navigate(routes.classes.path)}>
                    <Eye className='mr-2 h-4 w-4' />
                    Ver turmas
                  </DropdownMenuItem>

                  {canManage && (
                    <>
                      <DropdownMenuItem onClick={() => onEditSchool?.(school)}>
                        <Pencil className='mr-2 h-4 w-4' />
                        Editar escola
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDeleteSchool?.(school)}
                        className='text-destructive focus:text-destructive'
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Excluir escola
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </DataListHeader>

            <DataListContent className='sm:grid-cols-3'>
              <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
                <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                  <GraduationCap className='h-4 w-4' />
                  <span className='text-xs font-medium uppercase tracking-wide'>
                    Turmas
                  </span>
                </div>
                <p className='text-lg font-semibold text-foreground'>
                  {school.classCount}
                </p>
              </div>

              <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
                <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                  <Users className='h-4 w-4' />
                  <span className='text-xs font-medium uppercase tracking-wide'>
                    Alunos
                  </span>
                </div>
                <p className='text-lg font-semibold text-foreground'>
                  {school.studentCount}
                </p>
              </div>

              <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
                <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                  <BookOpen className='h-4 w-4' />
                  <span className='text-xs font-medium uppercase tracking-wide'>
                    Livros
                  </span>
                </div>
                <p className='text-lg font-semibold text-foreground'>
                  {school.bookCount}
                </p>
              </div>
            </DataListContent>
          </DataListItem>
        );
      })}
    </DataList>
  );
}
