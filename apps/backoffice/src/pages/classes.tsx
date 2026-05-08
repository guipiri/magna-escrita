import { ClassesTable } from '../components/grades/classes-table';

// const schoolYearLabels: Record<SchoolYear, string> = {
//   [SchoolYear.YEAR_2026]: '2026',
//   [SchoolYear.YEAR_2027]: '2027',
// };

export function GradesPage() {
  // const [search, setSearch] = useState('');

  // const {
  //   data: grades,
  //   isLoading,
  //   isFetching,
  //   error,
  //   refetch,
  // } = useQuery({
  //   queryKey: ['grades'],
  //   queryFn: getGrades,
  // });

  // const filteredGrades = useMemo(() => {
  //   const normalizedSearch = search.trim().toLowerCase();

  //   if (!normalizedSearch) {
  //     return grades ?? [];
  //   }

  //   return (grades ?? []).filter((grade) => {
  //     const haystack = [
  //       grade.name,
  //       grade.school.name,
  //       grade.unit.name ?? '',
  //       schoolYearLabels[grade.schoolYear],
  //     ]
  //       .join(' ')
  //       .toLowerCase();

  //     return haystack.includes(normalizedSearch);
  //   });
  // }, [grades, search]);

  // const totalStudents =
  //   grades?.reduce((sum, grade) => sum + grade.studentsCount, 0) ?? 0;
  // const schoolsCount = new Set(grades?.map((grade) => grade.school.id) ?? [])
  //   .size;

  // const formatDate = (date: string) =>
  //   new Intl.DateTimeFormat('pt-BR', {
  //     day: '2-digit',
  //     month: 'short',
  //     year: 'numeric',
  //   }).format(new Date(date));

  // if (isLoading) {
  //   return (
  //     <main className='px-4 py-10 md:px-8'>
  //       <div className='mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
  //         <p className='text-sm text-slate-500'>Carregando turmas...</p>
  //       </div>
  //     </main>
  //   );
  // }

  return (
    <main className='px-4 py-10 md:px-8'>
      <ClassesTable classes={[]} />
    </main>
  );
}
