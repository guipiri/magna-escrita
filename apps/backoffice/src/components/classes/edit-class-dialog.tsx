import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { updateClass, getClassStudents } from '../../services/classes-service';
import { getBookTemplates } from '../../services/book-templates-service';
import { getErrorMessage } from '../../services/error-messages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';

interface StudentInput {
  tempId: string;
  id?: string;
  name: string;
  hasBook?: boolean;
}

let tempIdCounter = 0;
const nextTempId = () => `new_${++tempIdCounter}`;

export function EditClassDialog({
  onClose,
  isOpen,
  classId,
  className: initialName,
  teacherName: initialTeacherName,
  bookTemplateId: initialBookTemplateId,
  hasBooks,
}: {
  onClose?: () => void;
  isOpen: boolean;
  classId: string;
  className: string;
  teacherName: string;
  bookTemplateId: string;
  bookTemplateName: string;
  hasBooks?: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [teacherName, setTeacherName] = useState(initialTeacherName);
  const [bookTemplateId, setBookTemplateId] = useState(initialBookTemplateId);
  const [students, setStudents] = useState<StudentInput[]>([]);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: fetchedStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => getClassStudents(classId),
    enabled: isOpen && !!classId,
  });

  const { data: bookTemplates } = useQuery({
    queryKey: ['book-templates'],
    queryFn: getBookTemplates,
    enabled: isOpen,
  });

  useEffect(() => {
    if (fetchedStudents) {
      setName(initialName);
      setTeacherName(initialTeacherName);
      setBookTemplateId(initialBookTemplateId);
      setStudents(
        fetchedStudents.map((s) => ({
          tempId: nextTempId(),
          id: s.id,
          name: s.name,
          hasBook: s.hasBook,
        })),
      );
    }
  }, [fetchedStudents, initialName, initialTeacherName, initialBookTemplateId]);

  const updateMutation = useMutation({
    mutationFn: (data: {
      name: string;
      teacherName: string;
      bookTemplateId?: string;
      students: Array<{ id?: string; name: string }>;
    }) => updateClass(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const isPending = updateMutation.isPending;
  const error = updateMutation.error;

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

    updateMutation.mutate({
      name,
      teacherName,
      bookTemplateId,
      students: studentsPayload,
    });
  };

  const allSaved = updateMutation.isSuccess;

  useEffect(() => {
    if (allSaved) {
      enqueueSnackbar('Turma editada com sucesso!', { variant: 'success' });
      onClose?.();
    }
    return () => {
      updateMutation.reset();
    };
  }, [allSaved, enqueueSnackbar, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader className='flex flex-row items-center'>
          <DialogTitle>Editar Turma</DialogTitle>
        </DialogHeader>
        <div className='max-w-lg'>
          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertCircle className='size-4' />
              <AlertDescription>
                {getErrorMessage(error) ||
                  'Erro ao editar turma. Tente novamente.'}
              </AlertDescription>
            </Alert>
          )}

          {studentsLoading ? (
            <p className='text-sm text-muted-foreground'>Carregando alunos...</p>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>
                  Nome da Turma
                </label>
                <Input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Ex: 3º Ano A'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>
                  Template de Livro
                </label>
                <select
                  value={bookTemplateId}
                  onChange={(e) => setBookTemplateId(e.target.value)}
                  className='h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:bg-muted disabled:cursor-not-allowed'
                  required
                  disabled={hasBooks}
                  title={hasBooks ? 'Não é possível alterar o template de livro pois a turma já possui livros criados' : undefined}
                >
                  <option value=''>Selecione um template</option>
                  {bookTemplates?.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {hasBooks && (
                  <p className='text-xs text-warning-foreground mt-1'>
                    Não é possível alterar o template de livro pois a turma já possui livros criados.
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>
                  Nome da Professora
                </label>
                <Input
                  type='text'
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder='Profª Claudia'
                  required
                />
              </div>

              <div>
                <div className='flex items-center justify-between mb-1'>
                  <label className='block text-sm font-medium text-foreground'>Alunos</label>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={addStudent}
                    className='text-primary hover:text-primary'
                  >
                    <Plus className='size-4 mr-1' />
                    Adicionar
                  </Button>
                </div>
                <div className='space-y-2 max-h-60 overflow-y-auto'>
                  {students.map((student) => (
                    <div
                      key={student.tempId}
                      className='flex gap-2 items-center'
                    >
                      <Input
                        type='text'
                        value={student.name}
                        onChange={(e) =>
                          updateStudentName(student.tempId, e.target.value)
                        }
                        placeholder='Nome do aluno'
                        required
                        className='flex-1 text-sm'
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => removeStudent(student.tempId)}
                        disabled={student.hasBook}
                        className='text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50'
                        title={student.hasBook ? 'Não é possível remover aluno com livro criado' : 'Remover aluno'}
                        aria-label='Remover aluno'
                      >
                        <Trash2 className='size-4' />
                      </Button>
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
