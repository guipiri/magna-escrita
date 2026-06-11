import type { GetBooksListResponse } from '@repo/shared';
import {
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Eye,
  GraduationCap,
  School,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface BookStatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: React.ElementType;
}

function getBookStatus(
  status: GetBooksListResponse['status'],
): BookStatusConfig {
  switch (status) {
    case 'READY':
      return { label: 'Pronto', variant: 'default', icon: CheckCircle2 };
    case 'REVISED_BY_SCHOOL':
      return { label: 'Em revisão', variant: 'secondary', icon: Clock3 };
    case 'ARCHIVED':
      return { label: 'Arquivado', variant: 'outline', icon: Eye };
    case 'DRAFT':
    default:
      return { label: 'Rascunho', variant: 'outline', icon: CircleDashed };
  }
}

function formatSchoolYear(schoolYear: string): string {
  return schoolYear.replace('YEAR_', '');
}

interface BooksListProps {
  books: GetBooksListResponse[];
}

function BooksEmptyState() {
  return (
    <div className='rounded-2xl border border-dashed border-border bg-card p-10 text-center'>
      <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
        <BookOpen className='size-6' />
      </div>
      <p className='text-sm font-medium text-foreground'>
        Nenhum livro encontrado
      </p>
      <p className='mt-1 text-sm text-muted-foreground'>
        Nenhum livro corresponde ao filtro atual.
      </p>
    </div>
  );
}

export function BooksList({ books }: BooksListProps) {
  const navigate = useNavigate();

  if (books.length === 0) {
    return <BooksEmptyState />;
  }

  return (
    <DataList>
      {books.map((book) => {
        const status = getBookStatus(book.status);
        const StatusIcon = status.icon;
        const bookTitle = book.title ?? 'Sem título';

        return (
          <DataListItem key={book.id}>
            <DataListHeader className='mb-4 flex items-start'>
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <DataListTitle className='truncate'>
                    {bookTitle}
                  </DataListTitle>
                  <Badge variant={status.variant}>
                    <StatusIcon className='size-3' />
                    {status.label}
                  </Badge>
                </div>
                <DataListDescription className='mt-0.5'>
                  {book.magnificCode}
                </DataListDescription>
              </div>
            </DataListHeader>

            <DataListContent className='sm:grid-cols-3'>
              {/* Student */}
              <div className='rounded-xl border border-border/70 bg-muted/20 p-3'>
                <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                  <GraduationCap className='h-4 w-4' />
                  <span className='text-xs font-medium uppercase tracking-wide'>
                    Aluno
                  </span>
                </div>
                <p className='text-sm font-semibold text-foreground'>
                  {book.student.name}
                </p>
              </div>

              {/* Class + school year */}
              <div className='rounded-xl border border-border/70 bg-muted/20 p-3'>
                <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                  <BookOpen className='h-4 w-4' />
                  <span className='text-xs font-medium uppercase tracking-wide'>
                    Turma
                  </span>
                </div>
                <p className='text-sm font-semibold text-foreground'>
                  {book.class.name}
                </p>
                <p className='text-xs text-muted-foreground'>
                  Ano letivo {formatSchoolYear(book.class.schoolYear)}
                </p>
              </div>

              {/* Unit + school */}
              <div className='rounded-xl border border-border/70 bg-muted/20 p-3'>
                <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                  <School className='h-4 w-4' />
                  <span className='text-xs font-medium uppercase tracking-wide'>
                    Unidade
                  </span>
                </div>
                <p className='text-sm font-semibold text-foreground'>
                  {book.unit.schoolName}
                </p>
                {book.unit.name && (
                  <p className='text-xs text-muted-foreground'>
                    {book.unit.name}
                  </p>
                )}
              </div>
            </DataListContent>

            <DataListFooter>
              <DataListMeta>
                <span className='inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground'>
                  {book.class.name} · {formatSchoolYear(book.class.schoolYear)}
                </span>
                <span className='inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground'>
                  {book.unit.schoolName}
                </span>
              </DataListMeta>

              <DataListActions>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => navigate(`/livros/${book.id}`)}
                >
                  <Eye className='h-4 w-4' />
                  Ver livro
                </Button>
              </DataListActions>
            </DataListFooter>
          </DataListItem>
        );
      })}
    </DataList>
  );
}
