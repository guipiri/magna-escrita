import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { SchoolCard, SchoolData } from '../components/schools/school-card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { EmptyState } from '../components/schools/empty-state';

// Mock data
const mockSchools: SchoolData[] = [
  {
    id: '1',
    name: 'Escola Municipal João da Silva',
    classCount: 12,
    studentCount: 345,
    bookCount: 289,
    status: 'active',
    lastActivity: 'Atualizado há 2 horas',
  },
  {
    id: '2',
    name: 'Colégio Estadual Maria Santos',
    classCount: 18,
    studentCount: 512,
    bookCount: 456,
    status: 'in-progress',
    lastActivity: 'Atualizado ontem',
  },
  {
    id: '3',
    name: 'Centro Educacional Esperança',
    classCount: 8,
    studentCount: 198,
    bookCount: 178,
    status: 'completed',
    lastActivity: 'Atualizado há 3 dias',
  },
  {
    id: '4',
    name: 'Escola Criativa Mundo Infantil',
    classCount: 10,
    studentCount: 267,
    bookCount: 234,
    status: 'active',
    lastActivity: 'Atualizado há 1 hora',
  },
  {
    id: '5',
    name: 'Instituto Educacional Saber',
    classCount: 15,
    studentCount: 423,
    bookCount: 387,
    status: 'in-progress',
    lastActivity: 'Atualizado há 5 horas',
  },
  {
    id: '6',
    name: 'Escola Montessori Jardim das Letras',
    classCount: 6,
    studentCount: 142,
    bookCount: 125,
    status: 'active',
    lastActivity: 'Atualizado há 30 minutos',
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [schools] = useState<SchoolData[]>(mockSchools);

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main className='flex-1 overflow-auto'>
      <div className='max-w-7xl mx-auto p-6'>
        {/* Page Header */}
        <div className='flex items-center justify-between mb-6'>
          <div>
          <h1 className='mb-2'>Unidades Escolares</h1>
            <p className='text-muted-foreground'>
              Gerencie todas as unidades escolares do projeto
            </p>
          </div>
          <Button>
            <Plus className='w-4 h-4' />
            Nova Unidade
          </Button>
        </div>

        {/* Search and Filters */}
        <div className='flex gap-3 mb-6'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Buscar unidades escolares...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
          <Button variant='outline'>
            <Filter className='w-4 h-4' />
            Filtros
          </Button>
        </div>

        {/* Schools Grid */}
        {filteredSchools.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {filteredSchools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onClick={() => console.log('Clicked school:', school.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState onAddSchool={() => console.log('Add school')} />
        )}

        {/* Summary Stats */}
        {filteredSchools.length > 0 && (
          <div className='mt-8 pt-6 border-t border-border'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='bg-muted/50 rounded-md p-4'>
                <p className='text-sm text-muted-foreground mb-1'>
                  Total de Unidades
                </p>
                <p className='text-2xl font-semibold text-foreground'>
                  {filteredSchools.length}
                </p>
              </div>
              <div className='bg-muted/50 rounded-md p-4'>
                <p className='text-sm text-muted-foreground mb-1'>
                  Total de Turmas
                </p>
                <p className='text-2xl font-semibold text-foreground'>
                  {filteredSchools.reduce((acc, s) => acc + s.classCount, 0)}
                </p>
              </div>
              <div className='bg-muted/50 rounded-md p-4'>
                <p className='text-sm text-muted-foreground mb-1'>
                  Total de Alunos
                </p>
                <p className='text-2xl font-semibold text-foreground'>
                  {filteredSchools.reduce((acc, s) => acc + s.studentCount, 0)}
                </p>
              </div>
              <div className='bg-muted/50 rounded-md p-4'>
                <p className='text-sm text-muted-foreground mb-1'>
                  Total de Livros
                </p>
                <p className='text-2xl font-semibold text-foreground'>
                  {filteredSchools.reduce((acc, s) => acc + s.bookCount, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
