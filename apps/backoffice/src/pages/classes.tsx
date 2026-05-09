import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClasses, deleteClass } from '../services/schools-service';
import { getErrorMessage } from '../services/error-messages';
import { ClassesTable, ClassData } from '../components/classes/classes-table';
import { CreateClassDialog } from '../components/classes/create-class-dialog';
import { CreateClassButton } from '../components/classes/create-class-button';
import { EditClassDialog } from '../components/classes/edit-class-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export function ClassesPage() {
  const [search, setSearch] = useState('');
  const [createClassModalOpen, setCreateClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingClass, setDeletingClass] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const {
    data: classes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setDeletingClass(null);
    },
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

  console.log(editingClass);

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
    <main className='px-4 py-10 md:px-8 '>
      <div className='mx-auto max-w-6xl space-y-6 mb-4'>
        <div className='flex justify-between items-center flex-wrap gap-4'>
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
          <CreateClassButton onClick={() => setCreateClassModalOpen(true)} />
        </div>
      </div>

      <ClassesTable
        classes={filteredClasses}
        onAddClass={() => setCreateClassModalOpen(true)}
        onEdit={(id) => {
          const classItem = classesData.find((c) => c.id === id);
          if (classItem)
            setEditingClass({ id: classItem.id, name: classItem.name });
        }}
        onDelete={(id) => {
          const classItem = classesData.find((c) => c.id === id);
          if (classItem)
            setDeletingClass({ id: classItem.id, name: classItem.name });
        }}
      />

      <CreateClassDialog
        onClose={() => setCreateClassModalOpen(false)}
        isOpen={createClassModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['classes'] });
          setCreateClassModalOpen(false);
        }}
      />

      <EditClassDialog
        isOpen={!!editingClass}
        onClose={() => setEditingClass(null)}
        classId={editingClass?.id ?? ''}
        className={editingClass?.name ?? ''}
      />

      <AlertDialog
        open={!!deletingClass}
        onOpenChange={(open) => {
          if (!open) setDeletingClass(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a turma "{deletingClass?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteMutation.isError && (
            <div className='p-3 bg-red-100 text-red-700 rounded text-sm'>
              {getErrorMessage(deleteMutation.error) ||
                'Erro ao excluir turma. Tente novamente.'}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingClass(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingClass) deleteMutation.mutate(deletingClass.id);
              }}
              disabled={deleteMutation.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
