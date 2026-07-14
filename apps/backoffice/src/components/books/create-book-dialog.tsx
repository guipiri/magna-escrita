import { useQuery, useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { getClasses, getClassStudents } from '../../services/classes-service';
import { createBook } from '../../services/books-service';
import { getErrorMessage } from '../../services/error-messages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

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
  });

  const {
    data: students,
    isLoading: studentsLoading,
  } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => getClassStudents(classId),
    enabled: !!classId,
  });

  // Reset student selection when class changes
  useEffect(() => {
    setStudentId('');
  }, [classId]);

  const createBookMutation = useMutation({
    mutationFn: createBook,
    onSuccess: (data) => {
      setClassId('');
      setStudentId('');
      setTitle('');
      enqueueSnackbar(
        `Livro "${data.title || 'Sem título'}" criado com sucesso para o(a) aluno(a) ${data.student.name}!`,
        { variant: 'success' },
      );
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentId) return;

    createBookMutation.mutate({
      studentId,
      title: title.trim() || null,
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
            <div className='mb-6 p-4 bg-red-100 text-red-700 rounded text-sm'>
              {getErrorMessage(createBookMutation.error) ||
                'Erro ao criar livro. Tente novamente.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>Turma</label>
              {classesLoading ? (
                <div className='text-sm text-gray-500'>Carregando turmas...</div>
              ) : classesError ? (
                <div className='text-sm text-red-500'>Erro ao carregar turmas.</div>
              ) : (
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className='w-full border border-gray-300 rounded px-3 py-2 bg-background'
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
                <label className='block text-sm font-medium mb-1'>Aluno(a)</label>
                {studentsLoading ? (
                  <div className='text-sm text-gray-500'>Carregando alunos...</div>
                ) : (
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className='w-full border border-gray-300 rounded px-3 py-2 bg-background'
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
              <label className='block text-sm font-medium mb-1'>Título do Livro</label>
              <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='w-full border border-gray-300 rounded px-3 py-2 bg-background'
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
