import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Loader2, RotateCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SchoolsList, SchoolData } from '../components/schools/schools-list';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6'
        >
          <div className='flex w-full gap-3 flex-wrap'>
            <div className='relative w-full flex-10'>
              <Search className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Buscar unidades escolares...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className='w-full md:w-auto'
            >
              <Plus className='size-4' />
              Nova Unidade
            </Button>
          </div>
        </motion.section>

        <div className='mt-6'>
          <SchoolsList
            schools={filteredSchools}
            onAddSchool={() => setIsCreateDialogOpen(true)}
          />
        </div>
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
