import { useMemo, useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SchoolCard, SchoolData } from '../components/schools/school-card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { EmptyState } from '../components/schools/empty-state';
import { CreateSchoolDialog } from '../components/schools/create-school-dialog';
import { getSchoolsList } from '../services/schools-service';
import { useAuth } from '../hooks/auth-hook';
import { UserRole } from '@repo/shared';
import { useNavigate } from 'react-router-dom';
import { routes } from '../main';

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const date = new Date(isoString).getTime();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Atualizado agora';
  if (diffMinutes < 60) return `Atualizado há ${diffMinutes} minutos`;
  if (diffHours < 24) return `Atualizado há ${diffHours} horas`;
  if (diffDays < 7) return `Atualizado há ${diffDays} dias`;
  return new Date(isoString).toLocaleDateString('pt-BR');
}

export default function Schools() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: schools,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchoolsList,
  });

  const schoolsData: SchoolData[] = useMemo(() => {
    if (!schools) return [];

    return schools.map((school) => ({
      ...school,
      lastActivity: formatRelativeTime(school.lastActivity),
    }));
  }, [schools]);

  const filteredSchools = schoolsData.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='max-w-7xl mx-auto p-6'>
          <div className='rounded-lg border border-border bg-card p-6 shadow-sm'>
            <p className='text-sm text-muted-foreground'>
              Carregando unidades...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='max-w-7xl mx-auto p-6'>
          <div className='rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm'>
            <p className='text-sm text-red-600'>
              Erro ao carregar unidades. Tente novamente.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (schools?.length === 1 && user?.role === UserRole.SCHOOL)
    navigate(routes.classes.path);

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
          <Button onClick={() => setIsCreateDialogOpen(true)}>
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
          <EmptyState onAddSchool={() => setIsCreateDialogOpen(true)} />
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

      <CreateSchoolDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ['schools'] });
        }}
      />
    </main>
  );
}
