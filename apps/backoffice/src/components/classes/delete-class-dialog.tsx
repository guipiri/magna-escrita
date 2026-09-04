import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { deleteClass } from '../../services/classes-service';
import { enqueueSnackbar } from 'notistack';

export function DeleteClassDialog({
  deletingClass,
  onSuccess,
  onConfirm,
  onCancel,
  onClose,
}: {
  deletingClass: { id: string; name: string } | null;
  onSuccess?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Failed to delete class:', error);
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
      onClose?.();
    },
  });
  return (
    <AlertDialog open={!!deletingClass} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a turma "{deletingClass?.name}"? Esta
            ação vai excluir também os livros da turma e não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (!deletingClass) return;
              deleteMutation.mutate(deletingClass.id);
              onConfirm?.();
            }}
            disabled={deleteMutation.isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
