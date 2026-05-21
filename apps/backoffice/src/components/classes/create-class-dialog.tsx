import { useQuery, useMutation } from '@tanstack/react-query';
import { SubmitEvent, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { createClass, getSchoolUnits } from '../../services/schools-service';
import { getBookTemplates } from '../../services/book-templates-service';
import { getErrorMessage } from '../../services/error-messages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { CreateClassButton } from './create-class-button';

export function CreateClassDialog({
  onClose,
  isOpen,
  onSuccess,
}: {
  onClose?: () => void;
  isOpen: boolean;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [unitId, setUnitId] = useState<string>();
  const [bookTemplateId, setBookTemplateId] = useState<string>('');
  const [studentsText, setStudentsText] = useState('');

  const { enqueueSnackbar } = useSnackbar();

  const {
    data: schools,
    isLoading: schoolsLoading,
    error,
  } = useQuery({
    queryKey: ['school-units'],
    queryFn: getSchoolUnits,
  });

  const { data: bookTemplates, isLoading: bookTemplatesLoading } = useQuery({
    queryKey: ['book-templates'],
    queryFn: getBookTemplates,
  });

  useEffect(() => {
    if (!bookTemplateId && bookTemplates?.[0]) {
      setBookTemplateId(bookTemplates[0].id);
    }
  }, [bookTemplateId, bookTemplates]);

  const createClassMutation = useMutation({
    mutationFn: createClass,
    onSuccess: (data) => {
      setName('');
      setStudentsText('');
      setTeacherName('');
      setBookTemplateId('');
      enqueueSnackbar(
        `Turma "${data.name}" criada com ${data.students.length} aluno(s)!`,
        { variant: 'success' },
      );
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const students = studentsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    createClassMutation.mutate({
      name,
      students,
      unitId,
      teacherName,
      bookTemplateId,
    });
  };

  const units = schools?.flatMap((school) =>
    school.units.map((unit) => ({
      id: unit.id,
      name: `${school.name} - ${unit.name || 'Sem nome'}`,
    })),
  );

  if (schoolsLoading || bookTemplatesLoading) {
    return (
      <main className='px-4 py-12 text-center text-gray-500'>
        Carregando...
      </main>
    );
  }

  if (schools && schools.length === 0) {
    return (
      <main className='px-4 py-12 text-center text-gray-500'>
        Nenhuma escola encontrada. Verifique se você tem acesso a alguma escola.
      </main>
    );
  }

  if (!schools || error) {
    return (
      <main className='px-4 py-12 text-center text-red-500'>
        Erro ao carregar escolas. Tente novamente.
      </main>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader className='flex flex-row items-center'>
          <DialogTitle>Criar Turma</DialogTitle>
        </DialogHeader>
        <div className='max-w-lg'>
          {createClassMutation.isError && (
            <div className='mb-6 p-4 bg-red-100 text-red-700 rounded'>
              {getErrorMessage(createClassMutation.error) ||
                'Erro ao criar turma. Tente novamente.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            {schools && schools.length > 1 && (
              <div>
                <label className='block text-sm font-medium mb-1'>Escola</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className='w-full border border-gray-300 rounded px-3 py-2'
                  required
                >
                  <option value=''>Selecione uma escola</option>
                  {units?.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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

            <div className='flex-2'>
              <label className='block text-sm font-medium mb-1'>
                Template de Livro
              </label>
              <select
                value={bookTemplateId}
                onChange={(e) => setBookTemplateId(e.target.value)}
                className='w-full border border-gray-300 rounded px-3 py-2'
                required
              >
                <option value=''>Selecione um template</option>
                {bookTemplates?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {bookTemplates && bookTemplates.length === 0 && (
              <p className='text-sm text-red-600'>
                Nenhum template de livro encontrado. Crie um template antes de
                cadastrar turmas.
              </p>
            )}

            <div>
              <label className='block text-sm font-medium mt-4 mb-1'>
                Nome da Professora
              </label>
              <input
                type='text'
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className='w-full border border-gray-300 rounded px-3 py-2'
                placeholder='Profª Claudia'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Alunos (um por linha)
              </label>
              <textarea
                value={studentsText}
                onChange={(e) => setStudentsText(e.target.value)}
                className='w-full border border-gray-300 rounded px-3 py-2 h-40'
                placeholder={`Maria Souza\nJoão Silva\nAna Oliveira`}
                required
              />
            </div>

            <CreateClassButton
              type='submit'
              disabled={
                createClassMutation.isPending ||
                !bookTemplateId ||
                (bookTemplates?.length ?? 0) === 0
              }
            >
              {createClassMutation.isPending ? 'Criando...' : 'Criar Turma'}
            </CreateClassButton>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
