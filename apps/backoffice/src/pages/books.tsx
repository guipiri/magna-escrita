import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle2, Clock3, Search } from 'lucide-react';
import { getBooks } from '../services/books-service';
import { BooksList } from '../components/books/books-list';
import { CreateBookButton } from '../components/books/create-book-button';
import { BulkUploadDialog } from '../components/books/bulk-upload-dialog';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';

export function BooksPage() {
  const [search, setSearch] = useState('');
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['books'],
    queryFn: getBooks,
  });

  const books = data ?? [];

  const filteredBooks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return books;

    return books.filter((book) => {
      const haystack = [
        book.title ?? '',
        book.enrollment.studentName,
        book.class.name,
        book.class.schoolYear,
        book.unit.schoolName,
        book.unit.name ?? '',
        book.magnificCode,
        book.status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [books, search]);

  const { totalBooks, readyBooks, reviewBooks } = books.reduce(
    (acc, book) => {
      acc.totalBooks++;
      if (book.status === 'READY') acc.readyBooks++;
      if (book.status === 'FOR_REVIEW') acc.reviewBooks++;
      return acc;
    },
    { totalBooks: 0, readyBooks: 0, reviewBooks: 0 },
  );

  if (isLoading) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='rounded-3xl border border-border bg-card p-6 shadow-sm'>
            <p className='text-sm text-muted-foreground'>
              Carregando livros...
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
              Erro ao carregar livros. Tente novamente.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 overflow-auto'>
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-3xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6'
        >
          <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-2'>
              <div>
                <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
                  Livros
                </h1>
                <p className='mt-2 text-sm text-muted-foreground'>
                  {totalBooks} livros • {readyBooks} prontos • {reviewBooks} em
                  revisão
                </p>
              </div>
            </div>

            <div className='flex w-full flex-col gap-3 sm:max-w-md'>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  type='search'
                  placeholder='Buscar por aluno, turma, livro ou unidade...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-9'
                />
              </div>

              <CreateBookButton
                onBulkUpload={() => setIsBulkUploadOpen(true)}
                className='w-full sm:w-auto sm:self-end'
              />
            </div>
          </div>

          <div className='mt-6 grid gap-4 md:grid-cols-3'>
            <Card>
              <CardContent className='flex items-center gap-3 p-5'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                  <BookOpen className='size-5' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Total</p>
                  <p className='text-2xl font-semibold text-foreground'>
                    {totalBooks}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='flex items-center gap-3 p-5'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600'>
                  <CheckCircle2 className='size-5' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Prontos</p>
                  <p className='text-2xl font-semibold text-foreground'>
                    {readyBooks}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='flex items-center gap-3 p-5'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600'>
                  <Clock3 className='size-5' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Em revisão</p>
                  <p className='text-2xl font-semibold text-foreground'>
                    {reviewBooks}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        <div className='mt-6'>
          <BooksList books={filteredBooks} />
        </div>
      </div>

      <BulkUploadDialog
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
      />
    </main>
  );
}
