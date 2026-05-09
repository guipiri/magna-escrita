import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { createClass, getSchoolUnits } from '../../services/schools-service';
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
  const [unitId, setUnitId] = useState<string>();
  const [studentsText, setStudentsText] = useState('');
  const [createdGrade, setCreatedGrade] = useState<{
    name: string;
    students: number;
  } | null>(null);

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchoolUnits,
  });

  const createClassMutation = useMutation({
    mutationFn: createClass,
    onSuccess: (data) => {
      setCreatedGrade({ name: data.name, students: data.students.length });
      setName('');
      setStudentsText('');
      if (onSuccess) onSuccess();
    },
    onError: () => setCreatedGrade(null),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const students = studentsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    createClassMutation.mutate({ name, students, unitId });
  };

  const units = schools?.flatMap((school) =>
    school.units.map((unit) => ({
      id: unit.id,
      name: `${school.name} - ${unit.name || 'Sem nome'}`,
    })),
  );

  if (schoolsLoading) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader className='flex flex-row items-center'>
          <DialogTitle>Criar Turma</DialogTitle>
        </DialogHeader>
        <div className='max-w-lg'>
          {createdGrade && (
            <div className='mb-6 p-4 bg-green-100 text-green-800 rounded'>
              Turma "{createdGrade.name}" criada com {createdGrade.students}{' '}
              aluno(s)!
            </div>
          )}

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
