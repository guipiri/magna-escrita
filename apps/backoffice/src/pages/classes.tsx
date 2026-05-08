import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getClasses } from '../services/schools-service';
import { ClassesTable, ClassData } from '../components/classes/classes-table';
import { Button } from '../components/ui/button';
import { CreateClass } from './create-class';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

export function GradesPage() {
  const [search, setSearch] = useState('');
  const [createClassModalOpen, setCreateClassModalOpen] = useState(false);

  const {
    data: classes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
  });

  const classesData: ClassData[] = useMemo(() => {
    if (!classes) return [];

    return classes.map((grade) => ({
      id: grade.id,
      name: grade.name,
      teacher: grade.unit.name || 'N/A',
      studentCount: grade.studentsCount,
      bookCount: grade.bookCount.total,
      booksCompleted: grade.bookCount.completed,
      status: (grade.bookCount.completed === grade.bookCount.total &&
      grade.bookCount.total > 0
        ? 'completed'
        : grade.bookCount.completed > 0
          ? 'in-progress'
          : 'active') as 'active' | 'in-progress' | 'completed',
      school: grade.school.name,
    }));
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return classesData;
    }

    return classesData.filter((classItem) => {
      const haystack = [classItem.name, classItem.school, classItem.teacher]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [classesData, search]);

  const totalStudents = classesData.reduce((sum, c) => sum + c.studentCount, 0);
  const schoolsCount = new Set(classesData.map((c) => c.school)).size;

  if (isLoading) {
    return (
      <main className='px-4 py-10 md:px-8'>
        <div className='mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-slate-500'>Carregando turmas...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='px-4 py-10 md:px-8'>
        <div className='mx-auto max-w-6xl rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm'>
          <p className='text-sm text-red-600'>
            Erro ao carregar turmas. Tente novamente.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className='px-4 py-10 md:px-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold'>Turmas</h1>
            <p className='text-sm text-slate-500'>
              {classesData.length} turmas • {totalStudents} alunos •{' '}
              {schoolsCount} escolas
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Buscar turmas...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='px-4 py-2 rounded-lg border border-slate-200 text-sm'
              />
            </div>
          </div>
          <Dialog
            open={createClassModalOpen}
            onOpenChange={setCreateClassModalOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setCreateClassModalOpen(true)}>
                Adicionar Turma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className='flex flex-row items-center'>
                <DialogTitle>Criar Turma</DialogTitle>
              </DialogHeader>
              <CreateClass onClose={() => setCreateClassModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ClassesTable
        classes={filteredClasses}
        onAddClass={() => setCreateClassModalOpen(true)}
      />
    </main>
  );
}
