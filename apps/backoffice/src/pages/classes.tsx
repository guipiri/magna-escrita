import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getClasses } from '../services/classes-service';
import { ClassesList, ClassData } from '../components/classes/classes-list';
import { CreateClassDialog } from '../components/classes/create-class-dialog';
import { CreateClassButton } from '../components/classes/create-class-button';
import { EditClassDialog } from '../components/classes/edit-class-dialog';
import { DeleteClassDialog } from '../components/classes/delete-class-dialog';
import { Input } from '../components/ui/input';

export function ClassesPage() {
  const [search, setSearch] = useState('');
  const [createClassModalOpen, setCreateClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<{
    id: string;
    name: string;
    teacherName: string;
    bookTemplateId: string;
    bookTemplateName: string;
    hasBooks?: boolean;
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
  const classesData: ClassData[] = useMemo(() => {
    if (!classes) return [];

    return classes.map((_class) => ({
      id: _class.id,
      name: _class.name,
      teacher: _class.teacherName,
      bookTemplateName: _class.bookTemplate.name,
      bookTemplateId: _class.bookTemplate.id,
      studentCount: _class.studentsCount,
      bookCount: _class.bookCount.total,
      booksCompleted: _class.bookCount.completed,
      booksRevisedBySchool:
        _class.bookCount.revisedBySchool +
        _class.bookCount.ready +
        _class.bookCount.archived,
      schoolYear: _class.schoolYear,
      schoolName: _class.school.name,
    }));
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return classesData;
    }

    return classesData.filter((classItem) => {
      const haystack = [classItem.name, classItem.schoolName, classItem.teacher]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [classesData, search]);

  // O(1) lookup map — avoids two O(n) .find() calls in onEdit and onDelete
  const classesMap = useMemo(
    () => new Map(classesData.map((c) => [c.id, c])),
    [classesData],
  );

  if (isLoading) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='rounded-3xl border border-border bg-card p-6 shadow-sm'>
            <p className='text-sm text-muted-foreground'>
              Carregando turmas...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm'>
            <p className='text-sm text-red-600'>
              Erro ao carregar turmas. Tente novamente.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 overflow-auto'>
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
        <section className='rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-6 flex flex-wrap sm:flex-nowrap items-center gap-3'>
          <div className='relative w-full'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Buscar turmas...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>

          <CreateClassButton
            onClick={() => setCreateClassModalOpen(true)}
            className='w-full sm:w-auto sm:self-end'
          >
            Adicionar turma
          </CreateClassButton>
        </section>

        <div className='mt-6'>
          <ClassesList
            classes={filteredClasses}
            onAddClass={() => setCreateClassModalOpen(true)}
            onEdit={(id) => {
              const classItem = classesMap.get(id);
              if (classItem) {
                setEditingClass({
                  id: classItem.id,
                  name: classItem.name,
                  teacherName: classItem.teacher,
                  bookTemplateId: classItem.bookTemplateId,
                  bookTemplateName: classItem.bookTemplateName,
                  hasBooks: classItem.bookCount > 0,
                });
              }
            }}
            onDelete={(id) => {
              const classItem = classesMap.get(id);
              if (classItem) {
                setDeletingClass({ id: classItem.id, name: classItem.name });
              }
            }}
          />
        </div>

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
          teacherName={editingClass?.teacherName ?? ''}
          bookTemplateId={editingClass?.bookTemplateId ?? ''}
          bookTemplateName={editingClass?.bookTemplateName ?? ''}
          hasBooks={!!editingClass?.hasBooks}
        />

        <DeleteClassDialog
          onSuccess={() => setDeletingClass(null)}
          onCancel={() => setDeletingClass(null)}
          onClose={() => setDeletingClass(null)}
          deletingClass={deletingClass}
        />
      </div>
    </main>
  );
}
