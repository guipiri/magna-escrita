import { useQuery, useMutation } from '@tanstack/react-query';
import { SubmitEvent, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { SchoolYear } from '@repo/shared';
import {
  createClass,
  getSchoolUnits,
  getSchoolYears,
} from '../../services/schools-service';
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
  const [schoolYear, setSchoolYear] = useState<SchoolYear | undefined>();
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

  const { data: schoolYears, isLoading: schoolYearsLoading } = useQuery({
    queryKey: ['school-years'],
    queryFn: getSchoolYears,
  });

  useEffect(() => {
    if (!schoolYear && schoolYears?.[0]) {
      setSchoolYear(schoolYears[0].value);
    }
  }, [schoolYear, schoolYears]);

  const createClassMutation = useMutation({
    mutationFn: createClass,
    onSuccess: (data) => {
      setName('');
      setStudentsText('');
      setTeacherName('');
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
      schoolYear: schoolYear ?? undefined,
    });
  };

  const units = schools?.flatMap((school) =>
    school.units.map((unit) => ({
      id: unit.id,
      name: `${school.name} - ${unit.name || 'Sem nome'}`,
    })),
  );

  if (schoolsLoading || schoolYearsLoading) {
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

            <div className='flex gap-2 items-center'>
              <div className='flex-8'>
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
                  Ano Letivo
                </label>
                <select
                  value={schoolYear ?? ''}
                  onChange={(e) => setSchoolYear(e.target.value as SchoolYear)}
                  className='w-full border border-gray-300 rounded px-3 py-2'
                  required
                >
                  <option value=''>Selecione um ano letivo</option>
                  {schoolYears?.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
              disabled={createClassMutation.isPending}
            >
              {createClassMutation.isPending ? 'Criando...' : 'Criar Turma'}
            </CreateClassButton>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
