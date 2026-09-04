import { UserRole, type GetBooksListResponse } from '@repo/shared';
import {
  BookOpen,
  GraduationCap,
  School,
  MoreHorizontal,
  FileDown,
  Loader2,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DataList,
  DataListContent,
  DataListDescription,
  DataListHeader,
  DataListItem,
  DataListTitle,
} from '../ui/data-list';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { generateFinalBookPdf } from '../../services/books-service';
import { getErrorMessage } from '../../services/error-messages';
import { routes } from '../../main';
import { getBookStatusConfig } from '../../utils/book-status';
import { useAuth } from '../../hooks/auth-hook';

function formatSchoolYear(schoolYear: string): string {
  return schoolYear.replace('YEAR_', '');
}

interface BooksListProps {
  books: GetBooksListResponse[];
}

function BooksEmptyState() {
  return (
    <div className='rounded-xl border border-dashed border-border bg-card p-10 text-center'>
      <div className='mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
        <BookOpen className='size-5' />
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
  const { user, isLoading: isUserLoading } = useAuth();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const generatePdfMutation = useMutation({
    mutationFn: generateFinalBookPdf,
    onSuccess: (data) => {
      enqueueSnackbar(
        data.message ||
          'Geração de PDF do livro enviada para a fila com sucesso!',
        {
          variant: 'success',
        },
      );
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  if (books.length === 0) {
    return <BooksEmptyState />;
  }

  const isAdminMenuItem =
    !isUserLoading && user && user.role === UserRole.ADMIN;

  return (
    <DataList>
      {books.map((book) => {
        const status = getBookStatusConfig(book.status);
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className='h-8 w-8 p-0'
                    variant='ghost'
                    size='icon'
                    aria-label='Ações do livro'
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuItem
                    onClick={() => navigate(`${routes.books.path}/${book.id}`)}
                  >
                    <Pencil className='h-4 w-4 mr-2' />
                    Editar
                  </DropdownMenuItem>
                  {book.interiorPdfUrl && isAdminMenuItem && (
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(book.interiorPdfUrl!, '_blank')
                      }
                    >
                      <FileDown className='mr-2 h-4 w-4' />
                      Ver miolo (PDF)
                    </DropdownMenuItem>
                  )}
                  {book.coverPdfUrl && isAdminMenuItem && (
                    <DropdownMenuItem
                      onClick={() => window.open(book.coverPdfUrl!, '_blank')}
                    >
                      <FileDown className='mr-2 h-4 w-4' />
                      Ver capa (PDF)
                    </DropdownMenuItem>
                  )}
                  {isAdminMenuItem && (
                    <DropdownMenuItem
                      disabled={generatePdfMutation.isPending}
                      onClick={() => generatePdfMutation.mutate(book.id)}
                    >
                      {generatePdfMutation.isPending &&
                      generatePdfMutation.variables === book.id ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        <Sparkles className='mr-2 h-4 w-4' />
                      )}
                      Gerar PDFs
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </DataListHeader>

            <DataListContent className='sm:grid-cols-3'>
              {/* Student */}
              <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
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
              <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
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
              <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
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
          </DataListItem>
        );
      })}
    </DataList>
  );
}
