import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { createGrade, getSchoolUnits } from '../services/schools-service';
import { getErrorMessage } from '../services/error-messages';

export function TurmasPage() {
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

  const createGradeMutation = useMutation({
    mutationFn: createGrade,
    onSuccess: (data) => {
      setCreatedGrade({ name: data.name, students: data.students.length });
      setName('');
      setStudentsText('');
    },
    onError: () => setCreatedGrade(null),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const students = studentsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    createGradeMutation.mutate({ name, students, unitId });
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
    <div className='max-w-lg mx-auto'>
      <h2 className='text-2xl font-semibold mb-6'>Criar Turma</h2>

      {createdGrade && (
        <div className='mb-6 p-4 bg-green-100 text-green-800 rounded'>
          Turma "{createdGrade.name}" criada com {createdGrade.students}{' '}
          aluno(s)!
          <button
            className='ml-4 underline hover:cursor-pointer'
            onClick={() => setCreatedGrade(null)}
          >
            Fechar
          </button>
        </div>
      )}

      {createGradeMutation.isError && (
        <div className='mb-6 p-4 bg-red-100 text-red-700 rounded'>
          {getErrorMessage(createGradeMutation.error) ||
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

        <button
          type='submit'
          disabled={createGradeMutation.isPending}
          className='w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 hover:cursor-pointer transition-colors'
        >
          {createGradeMutation.isPending ? 'Criando...' : 'Criar Turma'}
        </button>
      </form>
    </div>
  );
}
