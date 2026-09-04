import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { deleteSchool } from '../../services/schools-service';
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
import { AlertCircle, AlertTriangle } from 'lucide-react';

export interface DeletingSchoolInfo {
  id: string;
  name: string;
  canDelete?: boolean;
}

export function DeleteSchoolDialog({
  school,
  isOpen,
  onClose,
  onSuccess,
}: {
  school: DeletingSchoolInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const deleteMutation = useMutation({
    mutationFn: deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      enqueueSnackbar('Escola excluída com sucesso!', {
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

  if (!school) return null;

  const isBlocked = school.canDelete === false;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='size-5 text-destructive' />
            Excluir Escola
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBlocked ? (
              <span>
                A escola <strong className='text-foreground'>{school.name}</strong> não pode ser excluída no momento.
              </span>
            ) : (
              <span>
                Tem certeza que deseja excluir a escola{' '}
                <strong className='text-foreground'>{school.name}</strong>? Esta ação não pode ser desfeita e todas as unidades vazias associadas a ela serão removidas.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isBlocked && (
          <Alert variant='destructive' className='my-2'>
            <AlertCircle className='size-4' />
            <AlertDescription>
              Esta escola possui entidades vinculadas (turmas, eventos ou usuários) e não pode ser excluída. Para excluí-la, primeiro remova suas turmas, eventos e usuários vinculados.
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {isBlocked ? 'Entendido' : 'Cancelar'}
          </AlertDialogCancel>
          {!isBlocked && (
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(school.id)}
              disabled={deleteMutation.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Escola'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
