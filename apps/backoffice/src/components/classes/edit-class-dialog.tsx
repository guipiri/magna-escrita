import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  updateClass,
  getClassStudents,
  updateClassStudents,
} from '../../services/schools-service';
import { getErrorMessage } from '../../services/error-messages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Plus, X } from 'lucide-react';

interface StudentInput {
  tempId: string;
  id?: string;
  name: string;
}

let tempIdCounter = 0;
const nextTempId = () => `new_${++tempIdCounter}`;

export function EditClassDialog({
  onClose,
  isOpen,
  classId,
  className: initialName,
}: {
  onClose?: () => void;
  isOpen: boolean;
  classId: string;
  className: string;
}) {
  const [name, setName] = useState(initialName);
  const [students, setStudents] = useState<StudentInput[]>([]);
  const queryClient = useQueryClient();

  const { data: fetchedStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => getClassStudents(classId),
    enabled: isOpen && !!classId,
  });

  useEffect(() => {
    if (fetchedStudents) {
      setName(initialName);
      setStudents(
        fetchedStudents.map((s) => ({
          tempId: nextTempId(),
          id: s.id,
          name: s.name,
        })),
      );
    }
  }, [fetchedStudents, initialName]);

  const updateNameMutation = useMutation({
    mutationFn: (data: { name: string }) => updateClass(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const updateStudentsMutation = useMutation({
    mutationFn: (data: { students: Array<{ id?: string; name: string }> }) =>
      updateClassStudents(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const isPending =
    updateNameMutation.isPending || updateStudentsMutation.isPending;
  const error = updateNameMutation.error || updateStudentsMutation.error;

  const addStudent = () => {
    setStudents((prev) => [...prev, { tempId: nextTempId(), name: '' }]);
  };

  const removeStudent = (tempId: string) => {
    setStudents((prev) => prev.filter((s) => s.tempId !== tempId));
  };

  const updateStudentName = (tempId: string, name: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, name } : s)),
    );
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validStudents = students
      .map((s) => ({ name: s.name.trim() }))
      .filter((s) => s.name.length > 0);

    if (validStudents.length === 0) return;

    const originalIds = new Set(fetchedStudents?.map((s) => s.id) ?? []);

    const studentsPayload = students
      .filter((s) => s.name.trim().length > 0)
      .map((s) => ({
        ...(s.id && originalIds.has(s.id) ? { id: s.id } : {}),
        name: s.name.trim(),
      }));

    updateNameMutation.mutate(
      { name },
      {
        onSuccess: () => {
          updateStudentsMutation.mutate({ students: studentsPayload });
        },
      },
    );
  };

  const allSaved =
    updateNameMutation.isSuccess && updateStudentsMutation.isSuccess;

  useEffect(() => {
    if (allSaved) {
      onClose?.();
    }
    return () => {
      updateNameMutation.reset();
      updateStudentsMutation.reset();
    };
  }, [allSaved, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader className='flex flex-row items-center'>
          <DialogTitle>Editar Turma</DialogTitle>
        </DialogHeader>
        <div className='max-w-lg'>
          {error && (
            <div className='mb-6 p-4 bg-red-100 text-red-700 rounded'>
              {getErrorMessage(error) ||
                'Erro ao editar turma. Tente novamente.'}
            </div>
          )}

          {studentsLoading ? (
            <p className='text-sm text-slate-500'>Carregando alunos...</p>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Nome da Turma
                </label>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='w-full border border-gray-300 rounded px-3 py-2'
                  placeholder='Ex: 3º Ano A'
                  required
                />
              </div>

              <div>
                <div className='flex items-center justify-between mb-1'>
                  <label className='block text-sm font-medium'>Alunos</label>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={addStudent}
                    className='text-blue-600'
                  >
                    <Plus className='w-4 h-4 mr-1' />
                    Adicionar
                  </Button>
                </div>
                <div className='space-y-2 max-h-60 overflow-y-auto'>
                  {students.map((student) => (
                    <div
                      key={student.tempId}
                      className='flex gap-2 items-center'
                    >
                      <input
                        type='text'
                        value={student.name}
                        onChange={(e) =>
                          updateStudentName(student.tempId, e.target.value)
                        }
                        className='flex-1 border border-gray-300 rounded px-3 py-2 text-sm'
                        placeholder='Nome do aluno'
                        required
                      />
                      <button
                        type='button'
                        onClick={() => removeStudent(student.tempId)}
                        className='p-1 text-red-500 hover:text-red-700'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className='flex gap-2 justify-end'>
                <Button type='button' variant='outline' onClick={onClose}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={isPending}>
                  {isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
