import { useQuery, useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { getClasses, getClassStudents } from '../../services/classes-service';
import { createBook } from '../../services/books-service';
import { getErrorMessage } from '../../services/error-messages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { AlertCircle } from 'lucide-react';

export function CreateBookDialog({
  onClose,
  isOpen,
  onSuccess,
}: {
  onClose?: () => void;
  isOpen: boolean;
  onSuccess?: () => void;
}) {
  const [classId, setClassId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  const { enqueueSnackbar } = useSnackbar();

  const {
    data: classes,
    isLoading: classesLoading,
    error: classesError,
  } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
    enabled: isOpen,
  });

  const {
    data: students,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => getClassStudents(classId),
    enabled: !!classId,
  });

  // Reset student when class changes
  useEffect(() => {
    setStudentId('');
  }, [classId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setClassId('');
      setStudentId('');
      setTitle('');
    }
  }, [isOpen]);

  const createBookMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      enqueueSnackbar('Livro criado com sucesso!', { variant: 'success' });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !studentId) {
      return;
    }

    createBookMutation.mutate({
      studentId,
      title: title.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader className='flex flex-row items-center'>
          <DialogTitle>Criar Livro Manualmente</DialogTitle>
        </DialogHeader>
        <div className='max-w-lg'>
          {createBookMutation.isError && (
            <div className='mb-6 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive'>
              <AlertCircle className='size-4 shrink-0 translate-y-0.5' />
              <span>
                {getErrorMessage(createBookMutation.error) ||
                  'Erro ao criar livro. Tente novamente.'}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-foreground mb-1'>
                Turma
              </label>
              {classesLoading ? (
                <div className='text-xs text-muted-foreground'>Carregando turmas...</div>
              ) : classesError ? (
                <div className='text-xs text-destructive'>Erro ao carregar turmas.</div>
              ) : (
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className='h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
                  required
                >
                  <option value=''>Selecione uma turma</option>
                  {classes?.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.unit.name || 'Sem Unidade'} - {cls.schoolYear.replace('YEAR_', '')})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {classId && (
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>
                  Aluno(a)
                </label>
                {studentsLoading ? (
                  <div className='text-xs text-muted-foreground'>Carregando alunos...</div>
                ) : studentsError ? (
                  <div className='text-xs text-destructive'>Erro ao carregar alunos.</div>
                ) : (
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className='h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
                    required
                  >
                    <option value=''>Selecione um(a) aluno(a)</option>
                    {students?.map((std) => (
                      <option
                        key={std.id}
                        value={std.id}
                        disabled={std.hasBook}
                      >
                        {std.name} {std.hasBook ? ' (Já possui livro)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-foreground mb-1'>
                Título do Livro
              </label>
              <Input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Ex: As Aventuras no Espaço'
              />
            </div>

            <Button
              type='submit'
              disabled={createBookMutation.isPending || !studentId}
              className='w-full'
            >
              {createBookMutation.isPending ? 'Criando...' : 'Criar Livro'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
