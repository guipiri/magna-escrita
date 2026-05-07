import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main className='px-4 py-12 md:py-16'>
      <div className='max-w-lg mx-auto space-y-4'>
        <Link
          to='/turmas'
          className='block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all'
        >
          <h2 className='text-xl font-semibold'>Criar Turma</h2>
          <p className='text-gray-600 mt-1'>
            Cadastre uma nova turma e adicione alunos
          </p>
        </Link>
      </div>
    </main>
  );
}
