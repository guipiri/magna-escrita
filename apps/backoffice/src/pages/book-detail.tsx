import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crop,
  FileImage,
  FileText,
  GraduationCap,
  ImageOff,
  Layers,
  Loader2,
  Pencil,
  Save,
  School,
  X,
} from 'lucide-react';
import type { BookDetailPage, BookPageType } from '@repo/shared';
import {
  getBookById,
  updateBookPage,
  updateBookPageDraw,
} from '../services/books-service';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../components/ui/utils';
import { useSnackbar } from 'notistack';
import { BookImageEditorDialog } from '../components/books/book-image-editor-dialog';

/* ─── helpers ───────────────────────────────────────────── */

function formatSchoolYear(s: string) {
  return s.replace('YEAR_', '');
}

type BookStatus = 'DRAFT' | 'FOR_REVIEW' | 'READY' | 'ARCHIVED';

function bookStatusConfig(status: BookStatus) {
  switch (status) {
    case 'READY':
      return { label: 'Pronto', variant: 'default' as const };
    case 'FOR_REVIEW':
      return { label: 'Em revisão', variant: 'secondary' as const };
    case 'ARCHIVED':
      return { label: 'Arquivado', variant: 'outline' as const };
    default:
      return { label: 'Rascunho', variant: 'outline' as const };
  }
}

const PAGE_TYPE_LABELS: Record<BookPageType, string> = {
  COVER: 'Capa',
  BACK_COVER: 'Contracapa',
  PREFACE: 'Prefácio',
  THANKS: 'Agradecimentos',
  BLANK: 'Em branco',
  TEXT: 'Texto',
  DRAW: 'Desenho',
  DRAW_TEXT: 'Desenho + Texto',
};

const PAGE_TYPE_ICONS: Record<BookPageType, React.ElementType> = {
  COVER: BookOpen,
  BACK_COVER: BookOpen,
  PREFACE: FileText,
  THANKS: FileText,
  BLANK: Layers,
  TEXT: FileText,
  DRAW: FileImage,
  DRAW_TEXT: FileImage,
};

function hasText(type: BookPageType) {
  return (
    type === 'TEXT' ||
    type === 'DRAW_TEXT' ||
    type === 'PREFACE' ||
    type === 'THANKS'
  );
}

function hasDraw(type: BookPageType) {
  return type === 'DRAW' || type === 'DRAW_TEXT';
}

/* ─── page card ─────────────────────────────────────────── */

interface PageCardProps {
  page: BookDetailPage;
  bookId: string;
  isActive: boolean;
}

function PageCard({ page, bookId, isActive }: PageCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [draft, setDraft] = useState(page.textContent ?? '');
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const drawSourceUrl = page.drawImageUrl || '';

  console.log('Rendering PageCard', { page });

  // Keep draft in sync when page data changes (after refetch)
  useEffect(() => {
    if (!isEditing) setDraft(page.textContent ?? '');
  }, [page.textContent, isEditing]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateBookPage(bookId, page.number, { textContent: draft || null }),
    onSuccess: () => {
      enqueueSnackbar('Página salva com sucesso!', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      setIsEditing(false);
    },
    onError: () => {
      enqueueSnackbar('Erro ao salvar página. Tente novamente.', {
        variant: 'error',
      });
    },
  });

  const saveDrawMutation = useMutation({
    mutationFn: (file: File) => updateBookPageDraw(bookId, page.number, file),
    onSuccess: () => {
      enqueueSnackbar('Imagem salva com sucesso!', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      setIsImageEditorOpen(false);
    },
    onError: () => {
      enqueueSnackbar('Erro ao salvar imagem. Tente novamente.', {
        variant: 'error',
      });
    },
  });

  const TypeIcon = PAGE_TYPE_ICONS[page.type] ?? Layers;
  const showText = hasText(page.type);
  const showDraw = hasDraw(page.type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: isActive ? 1 : 0.5, scale: isActive ? 1 : 0.97 }}
      transition={{ duration: 0.25 }}
      className='h-full'
    >
      <div className='flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm'>
        {/* card header */}
        <div className='flex items-center justify-between border-b border-border/70 px-5 py-3'>
          <div className='flex items-center gap-2'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <TypeIcon className='size-4' />
            </div>
            <div>
              <p className='text-sm font-semibold text-foreground'>
                Página {page.number}
              </p>
              <p className='text-xs text-muted-foreground'>
                {PAGE_TYPE_LABELS[page.type] ?? page.type}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-1'>
            {showDraw && drawSourceUrl && !isImageEditorOpen && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsImageEditorOpen(true)}
                aria-label='Editar imagem'
              >
                <Crop className='size-3.5' />
                Editar imagem
              </Button>
            )}

            {showText && !isEditing && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsEditing(true)}
                aria-label='Editar conteúdo'
              >
                <Pencil className='size-3.5' />
                Editar
              </Button>
            )}
          </div>

          {showText && isEditing && (
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setDraft(page.textContent ?? '');
                  setIsEditing(false);
                }}
              >
                <X className='size-3.5' />
                Cancelar
              </Button>
              <Button
                size='sm'
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <Save className='size-3.5' />
                )}
                Salvar
              </Button>
            </div>
          )}
        </div>

        {/* card body */}
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-5'>
          {/* draw image */}
          {showDraw && (
            <div className='relative'>
              <p className='mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Desenho
              </p>
              {drawSourceUrl ? (
                <div className='overflow-hidden rounded-xl border border-border/70 bg-muted/20'>
                  <img
                    src={drawSourceUrl}
                    alt={`Desenho da página ${page.number}`}
                    className='w-full object-contain'
                    style={{ maxHeight: 320 }}
                  />
                </div>
              ) : (
                <div className='flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground'>
                  <ImageOff className='size-6' />
                  <p className='text-xs'>Nenhuma imagem enviada</p>
                </div>
              )}
            </div>
          )}

          {/* text content */}
          {showText && (
            <div className='flex flex-1 flex-col gap-2'>
              <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Conteúdo de texto
              </p>
              {isEditing ? (
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder='Digite o conteúdo desta página...'
                  className='min-h-40 flex-1 resize-none text-sm'
                  autoFocus
                />
              ) : page.textContent ? (
                <p className='whitespace-pre-wrap rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-foreground'>
                  {page.textContent}
                </p>
              ) : (
                <div className='flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground'>
                  <FileText className='size-5' />
                  <p className='text-xs'>Sem conteúdo de texto</p>
                </div>
              )}
            </div>
          )}

          {/* blank / cover / etc. */}
          {!showText && !showDraw && (
            <div className='flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground'>
              <p className='text-xs'>
                {PAGE_TYPE_LABELS[page.type]} — sem conteúdo
              </p>
            </div>
          )}
        </div>

        <BookImageEditorDialog
          open={isImageEditorOpen}
          onOpenChange={setIsImageEditorOpen}
          sourceUrl={page.originalImageUrl || ''}
          pageNumber={page.number}
          onSave={async (file) => {
            await saveDrawMutation.mutateAsync(file);
          }}
        />
      </div>
    </motion.div>
  );
}

/* ─── main page ─────────────────────────────────────────── */

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    data: book,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['book', id],
    queryFn: () => getBookById(id!),
    enabled: !!id,
  });

  const pages = book?.pages ?? [];
  const currentPage = pages[currentIndex];
  const totalPages = pages.length;

  const goTo = useCallback(
    (idx: number) =>
      setCurrentIndex(Math.max(0, Math.min(idx, totalPages - 1))),
    [totalPages],
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
      if (e.key === 'ArrowRight') goTo(currentIndex + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, goTo]);

  /* ── loading / error states ── */
  if (isLoading) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='rounded-3xl border border-border bg-card p-6 shadow-sm'>
            <p className='text-sm text-muted-foreground'>Carregando livro...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm'>
            <p className='text-sm text-red-600'>
              Erro ao carregar livro. Tente novamente.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const statusCfg = bookStatusConfig(book.status);

  return (
    <main className='flex-1 overflow-auto'>
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
        {/* ── Header ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-3xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6'
        >
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='space-y-3'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => navigate('/livros')}
                className='-ml-2'
              >
                <ArrowLeft className='size-4' />
                Voltar à lista
              </Button>

              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
                    {book.title ?? 'Sem título'}
                  </h1>
                  <Badge variant={statusCfg.variant}>
                    <CheckCircle2 className='size-3' />
                    {statusCfg.label}
                  </Badge>
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {book.magnificCode}
                </p>
              </div>
            </div>
          </div>

          {/* info cards */}
          <div className='mt-5 grid gap-3 sm:grid-cols-3'>
            <div className='flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3'>
              <GraduationCap className='size-5 shrink-0 text-muted-foreground' />
              <div className='min-w-0'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Aluno
                </p>
                <p className='truncate text-sm font-semibold text-foreground'>
                  {book.enrollment.studentName}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3'>
              <BookOpen className='size-5 shrink-0 text-muted-foreground' />
              <div className='min-w-0'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Turma
                </p>
                <p className='truncate text-sm font-semibold text-foreground'>
                  {book.class.name}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {formatSchoolYear(book.class.schoolYear)}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3'>
              <School className='size-5 shrink-0 text-muted-foreground' />
              <div className='min-w-0'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Unidade
                </p>
                <p className='truncate text-sm font-semibold text-foreground'>
                  {book.unit.schoolName}
                </p>
                {book.unit.name && (
                  <p className='truncate text-xs text-muted-foreground'>
                    {book.unit.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Carousel ── */}
        {totalPages === 0 ? (
          <div className='mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground'>
            <Layers className='size-8' />
            <p className='text-sm'>Nenhuma página disponível ainda.</p>
          </div>
        ) : (
          <div className='mt-6'>
            {/* thumbnail strip */}
            <div className='mb-4 flex gap-2 overflow-x-auto pb-1'>
              {pages.map((p, idx) => {
                const Icon = PAGE_TYPE_ICONS[p.type] ?? Layers;
                return (
                  <button
                    key={p.number}
                    onClick={() => goTo(idx)}
                    aria-label={`Ir para página ${p.number}`}
                    className={cn(
                      'flex shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition-all duration-150',
                      idx === currentIndex
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    <Icon className='size-4' />
                    <span className='font-medium'>{p.number}</span>
                  </button>
                );
              })}
            </div>

            {/* main card area */}
            <div className='relative'>
              {/* prev button */}
              <button
                onClick={() => goTo(currentIndex - 1)}
                disabled={currentIndex === 0}
                aria-label='Página anterior'
                className='absolute -left-5 top-1/2 z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-border bg-card shadow-md transition-all hover:bg-accent disabled:opacity-30 disabled:pointer-events-none sm:-left-12'
              >
                <ChevronLeft className='size-4' />
              </button>

              {/* active card */}
              {currentPage && (
                <div className='min-h-105'>
                  <PageCard
                    key={currentPage.number}
                    page={currentPage}
                    bookId={book.id}
                    isActive
                  />
                </div>
              )}

              {/* next button */}
              <button
                onClick={() => goTo(currentIndex + 1)}
                disabled={currentIndex === totalPages - 1}
                aria-label='Próxima página'
                className='absolute -right-5 top-1/2 z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-border bg-card shadow-md transition-all hover:bg-accent disabled:opacity-30 disabled:pointer-events-none sm:-right-12'
              >
                <ChevronRight className='size-4' />
              </button>
            </div>

            {/* counter */}
            <p className='mt-4 text-center text-sm text-muted-foreground'>
              Página {currentIndex + 1} de {totalPages}
            </p>
          </div>
        )}

        {/* stats footer */}
        <div className='mt-6 grid gap-3 sm:grid-cols-3'>
          <Card>
            <CardContent className='flex items-center gap-3 p-4'>
              <div className='flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <Layers className='size-4' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Páginas</p>
                <p className='text-xl font-semibold'>{totalPages}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='flex items-center gap-3 p-4'>
              <div className='flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600'>
                <FileImage className='size-4' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Com desenho</p>
                <p className='text-xl font-semibold'>
                  {pages.filter((p) => p.drawImageUrl).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='flex items-center gap-3 p-4'>
              <div className='flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600'>
                <FileText className='size-4' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Com texto</p>
                <p className='text-xl font-semibold'>
                  {pages.filter((p) => p.textContent).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
