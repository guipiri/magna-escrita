import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { BookStatus, BookStatusEnum } from '@repo/shared';
import { deleteBook } from '../../services/books-service';
import { getErrorMessage } from '../../services/error-messages';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

export interface DeletingBookInfo {
  id: string;
  title: string | null;
  studentName?: string;
  status: BookStatus;
  hasRevisedPages?: boolean;
}

export function DeleteBookDialog({
  book,
  isOpen,
  onClose,
  onSuccess,
}: {
  book: DeletingBookInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      enqueueSnackbar('Livro excluído com sucesso!', {
        variant: 'success',
      });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  if (!book) return null;

  const isBlocked = book.status !== BookStatusEnum.DRAFT;
  const bookName = book.title ? `"${book.title}"` : 'Sem título';

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='size-5 text-destructive' />
            Excluir Livro
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBlocked ? (
              <span>
                O livro <strong className='text-foreground'>{bookName}</strong> não pode ser excluído no momento.
              </span>
            ) : (
              <span>
                Tem certeza que deseja excluir o livro{' '}
                <strong className='text-foreground'>{bookName}</strong>
                {book.studentName ? (
                  <> do aluno <strong className='text-foreground'>{book.studentName}</strong></>
                ) : null}
                ? Esta ação não pode ser desfeita e todas as páginas associadas serão removidas.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isBlocked && (
          <Alert variant='destructive' className='my-2'>
            <AlertCircle className='size-4' />
            <AlertDescription>
              Apenas livros com status Rascunho podem ser excluídos.
            </AlertDescription>
          </Alert>
        )}

        {!isBlocked && book.hasRevisedPages && (
          <Alert className='my-2 border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200'>
            <AlertTriangle className='size-4 text-amber-600 dark:text-amber-400' />
            <AlertDescription className='text-amber-800 dark:text-amber-300'>
              Atenção: Este livro já contém páginas revisadas. Ao confirmar a exclusão, todas as revisões e conteúdos salvos serão permanentemente excluídos.
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={deleteMutation.isPending}>
            {isBlocked ? 'Entendido' : 'Cancelar'}
          </AlertDialogCancel>
          {!isBlocked && (
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(book.id)}
              disabled={deleteMutation.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteMutation.isPending ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='size-4 animate-spin' />
                  Excluindo...
                </span>
              ) : (
                'Excluir Livro'
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

