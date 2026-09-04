import { useMemo, useState } from 'react';
import { Search, Plus, Loader2, RotateCw } from 'lucide-react';
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
    refetch,
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
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm'>
            <Loader2 className='size-5 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Carregando unidades...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive shadow-sm'>
            <p className='text-sm font-medium'>
              Erro ao carregar unidades. Tente novamente.
            </p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              className='gap-2 text-destructive border-destructive/30 hover:bg-destructive/10'
            >
              <RotateCw className='size-3.5' />
              Recarregar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (schools?.length === 1 && user?.role === UserRole.SCHOOL)
    navigate(routes.classes.path);

  return (
    <main className='flex-1 overflow-auto'>
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
        {/* Search and Action Bar */}
        <section className='rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6 mb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4'>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                Unidades Escolares
              </h1>
              <p className='text-sm text-muted-foreground mt-1'>
                Gerencie todas as unidades escolares do projeto
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className='shrink-0'>
              <Plus className='size-4' />
              Nova Unidade
            </Button>
          </div>

          <div className='relative w-full'>
            <Search className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Buscar unidades escolares...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>
        </section>

        {/* Schools Grid */}
        {filteredSchools.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {filteredSchools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        ) : (
          <EmptyState onAddSchool={() => setIsCreateDialogOpen(true)} />
        )}

        {/* Summary Stats */}
        {filteredSchools.length > 0 && (
          <div className='mt-8 pt-6 border-t border-border/70'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='rounded-lg border border-border/70 bg-muted/20 p-4'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1'>
                  Total de Unidades
                </p>
                <p className='text-2xl font-semibold text-foreground'>
                  {filteredSchools.length}
                </p>
              </div>
              <div className='rounded-lg border border-border/70 bg-muted/20 p-4'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1'>
                  Total de Turmas
                </p>
                <p className='text-2xl font-semibold text-foreground'>
                  {filteredSchools.reduce((acc, s) => acc + s.classCount, 0)}
                </p>
              </div>
              <div className='rounded-lg border border-border/70 bg-muted/20 p-4'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1'>
                  Total de Alunos
                </p>
                <p className='text-2xl font-semibold text-foreground'>
                  {filteredSchools.reduce((acc, s) => acc + s.studentCount, 0)}
                </p>
              </div>
              <div className='rounded-lg border border-border/70 bg-muted/20 p-4'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1'>
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
