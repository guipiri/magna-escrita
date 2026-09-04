import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Search, Loader2, RotateCw } from 'lucide-react';
import { getBooks } from '../services/books-service';
import { BooksList } from '../components/books/books-list';
import { CreateBookButton } from '../components/books/create-book-button';
import { BulkUploadDialog } from '../components/books/bulk-upload-dialog';
import { CreateBookDialog } from '../components/books/create-book-dialog';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export function BooksPage() {
  const [search, setSearch] = useState('');
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isCreateManualOpen, setIsCreateManualOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
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
        book.student.name,
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

  if (isLoading) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm'>
            <Loader2 className='size-5 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Carregando livros...</p>
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
              Erro ao carregar livros. Tente novamente.
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
              onCreateManual={() => setIsCreateManualOpen(true)}
              className='w-full md:w-auto'
            />
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

      <CreateBookDialog
        isOpen={isCreateManualOpen}
        onClose={() => setIsCreateManualOpen(false)}
        onSuccess={() => {
          setIsCreateManualOpen(false);
          queryClient.invalidateQueries({ queryKey: ['books'] });
        }}
      />
    </main>
  );
}
