import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crop,
  FileImage,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  Pencil,
  Save,
  School,
  UploadCloud,
  X,
  RotateCw,
} from 'lucide-react';
import {
  type BookDetailPage,
  type BookPageType,
  BookPageTypeEnum,
  type PageStatus,
  type GetBookDetailResponse,
  UserRole,
  BookStatusEnum,
  type BookStatus,
  PageStatusEnum,
  ErrorKeys,
} from '@repo/shared';
import {
  getBookById,
  updateBookPage,
  updateBookPageDraw,
  updateBook,
} from '../services/books-service';
import { uploadUnitLogo } from '../services/schools-service';
import {
  getErrorMessage,
  getErrorMessageByKey,
} from '../services/error-messages';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { cn } from '../components/ui/utils';
import { useSnackbar } from 'notistack';
import { BookImageEditorDialog } from '../components/books/book-image-editor-dialog';
import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../hooks/auth-hook';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { getBookStatusConfig } from '../utils/book-status';

/* ─── helpers ───────────────────────────────────────────── */

function formatSchoolYear(s: string) {
  return s.replace('YEAR_', '');
}

const FORBIDDEN_BOOK_STATUSES_FOR_SCHOOL: BookStatus[] = [
  BookStatusEnum.REVISED_BY_MAGNA,
  BookStatusEnum.READY_FOR_SALE,
  BookStatusEnum.ARCHIVED,
];

const PAGE_TYPE_LABELS: Record<BookPageType, string> = {
  [BookPageTypeEnum.COVER]: 'Capa',
  [BookPageTypeEnum.BACK_COVER]: 'Contracapa',
  [BookPageTypeEnum.PREFACE]: 'Prefácio',
  [BookPageTypeEnum.THANKS]: 'Agradecimentos',
  [BookPageTypeEnum.BLANK]: 'Em branco',
  [BookPageTypeEnum.TEXT]: 'Texto',
  [BookPageTypeEnum.DRAW]: 'Desenho',
  [BookPageTypeEnum.DRAW_TEXT]: 'Desenho + Texto',
};

const PAGE_TYPE_ICONS: Record<BookPageType, React.ElementType> = {
  [BookPageTypeEnum.COVER]: BookOpen,
  [BookPageTypeEnum.BACK_COVER]: BookOpen,
  [BookPageTypeEnum.PREFACE]: FileText,
  [BookPageTypeEnum.THANKS]: FileText,
  [BookPageTypeEnum.BLANK]: Layers,
  [BookPageTypeEnum.TEXT]: FileText,
  [BookPageTypeEnum.DRAW]: FileImage,
  [BookPageTypeEnum.DRAW_TEXT]: FileImage,
};

function hasText(type: BookPageType) {
  return (
    type === BookPageTypeEnum.TEXT ||
    type === BookPageTypeEnum.DRAW_TEXT ||
    type === BookPageTypeEnum.PREFACE ||
    type === BookPageTypeEnum.THANKS
  );
}

function hasDraw(type: BookPageType) {
  return (
    type === BookPageTypeEnum.DRAW ||
    type === BookPageTypeEnum.DRAW_TEXT ||
    type === BookPageTypeEnum.COVER
  );
}

/* ─── page card ─────────────────────────────────────────── */

interface PageCardProps {
  page: BookDetailPage;
  book: GetBookDetailResponse;
  isActive: boolean;
}

function PageCard({ page, book, isActive }: PageCardProps) {
  const bookId = book.id;
  const [isEditing, setIsEditing] = useState(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [draft, setDraft] = useState(page.textContent ?? '');
  const [titleDraft, setTitleDraft] = useState(book.title ?? '');
  const [bookGenreDraft, setBookGenreDraft] = useState(
    book.class.bookGenre ?? '',
  );
  const [bookGenreExplanationDraft, setBookGenreExplanationDraft] = useState(
    book.class.bookGenreExplanation ?? '',
  );
  const [thanksMessageDraft, setThanksMessageDraft] = useState(
    book.class.thanksMessage ?? '',
  );
  const [schoolMessageDraft, setSchoolMessageDraft] = useState(
    book.class.schoolMessage ?? '',
  );
  const [schoolTeamDraft, setSchoolTeamDraft] = useState(
    book.class.schoolTeam ?? '',
  );
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { user } = useAuth();
  const isBookReadyForSchool = FORBIDDEN_BOOK_STATUSES_FOR_SCHOOL.includes(
    book.status,
  );
  const isReadOnlyForSchool =
    user?.role === UserRole.SCHOOL && isBookReadyForSchool;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [imageVersion, setImageVersion] = useState(() => Date.now());

  useEffect(() => {
    if (isReadOnlyForSchool && isEditing) {
      setIsEditing(false);
    }
  }, [isReadOnlyForSchool, isEditing]);

  useEffect(() => {
    setImageVersion(Date.now());
  }, [page.drawImageUrl, page.originalImageUrl, book.updatedAt]);

  const drawSourceUrl = page.drawImageUrl
    ? `${page.drawImageUrl}${page.drawImageUrl.includes('?') ? '&' : '?'}v=${imageVersion}`
    : '';
  const originalSourceUrl = page.originalImageUrl
    ? `${page.originalImageUrl}${page.originalImageUrl.includes('?') ? '&' : '?'}v=${imageVersion}`
    : '';

  const statusMutation = useMutation({
    mutationFn: (newStatus: PageStatus) => {
      if (isReadOnlyForSchool) {
        throw new Error(getErrorMessageByKey(ErrorKeys.FORBIDDEN_BOOK_READY));
      }
      return updateBookPage(bookId, page.number, {
        status: newStatus,
      });
    },
    onSuccess: () => {
      enqueueSnackbar('Status da página atualizado!', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    },
  });

  // Keep draft in sync when page data changes (after refetch)
  useEffect(() => {
    if (!isEditing) {
      setDraft(page.textContent ?? '');
      setTitleDraft(book.title ?? '');
      setBookGenreDraft(book.class.bookGenre ?? '');
      setBookGenreExplanationDraft(book.class.bookGenreExplanation ?? '');
      setThanksMessageDraft(book.class.thanksMessage ?? '');
      setSchoolMessageDraft(book.class.schoolMessage ?? '');
      setSchoolTeamDraft(book.class.schoolTeam ?? '');
    }
  }, [
    page.textContent,
    book.title,
    book.class.bookGenre,
    book.class.bookGenreExplanation,
    book.class.thanksMessage,
    book.class.schoolMessage,
    book.class.schoolTeam,
    isEditing,
  ]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (isReadOnlyForSchool) {
        throw new Error(getErrorMessageByKey(ErrorKeys.FORBIDDEN_BOOK_READY));
      }
      if (page.type === BookPageTypeEnum.COVER) {
        return updateBook(bookId, { title: titleDraft || null });
      }
      if (page.type === BookPageTypeEnum.PREFACE) {
        return updateBookPage(bookId, page.number, {
          bookGenre: bookGenreDraft || null,
          bookGenreExplanation: bookGenreExplanationDraft || null,
        });
      }
      if (page.type === BookPageTypeEnum.THANKS) {
        return updateBookPage(bookId, page.number, {
          thanksMessage: thanksMessageDraft || null,
          schoolMessage: schoolMessageDraft || null,
          schoolTeam: schoolTeamDraft || null,
        });
      }
      return updateBookPage(bookId, page.number, {
        textContent: draft || null,
      });
    },
    onSuccess: () => {
      enqueueSnackbar(
        page.type === BookPageTypeEnum.COVER
          ? 'Capa salva com sucesso!'
          : page.type === BookPageTypeEnum.PREFACE
            ? 'Prefácio salvo com sucesso!'
            : page.type === BookPageTypeEnum.THANKS
              ? 'Agradecimentos salvos com sucesso!'
              : 'Página salva com sucesso!',
        { variant: 'success' },
      );
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      setIsEditing(false);
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err), {
        variant: 'error',
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => {
      if (isReadOnlyForSchool) {
        throw new Error(getErrorMessageByKey(ErrorKeys.FORBIDDEN_BOOK_READY));
      }
      return uploadUnitLogo(book.unit.id, file);
    },
    onSuccess: () => {
      enqueueSnackbar('Logo da escola atualizado!', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err), {
        variant: 'error',
      });
    },
  });

  const saveDrawMutation = useMutation({
    mutationFn: ({ file, originalFile }: { file: File; originalFile?: File }) => {
      if (isReadOnlyForSchool) {
        throw new Error(getErrorMessageByKey(ErrorKeys.FORBIDDEN_BOOK_READY));
      }
      return updateBookPageDraw(bookId, page.number, file, originalFile);
    },
    onSuccess: () => {
      setImageVersion(Date.now());
      enqueueSnackbar('Imagem salva com sucesso!', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      setIsImageEditorOpen(false);
      setDroppedFile(null);
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err), {
        variant: 'error',
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isReadOnlyForSchool) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) {
        setDroppedFile(file);
        setIsImageEditorOpen(true);
      } else {
        enqueueSnackbar('Por favor, envie um arquivo de imagem.', {
          variant: 'error',
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnlyForSchool) return;
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file?.type.startsWith('image/')) {
        setDroppedFile(file);
        setIsImageEditorOpen(true);
      } else {
        enqueueSnackbar('Por favor, envie um arquivo de imagem.', {
          variant: 'error',
        });
      }
      e.target.value = '';
    }
  };

  const editorSourceUrl = droppedFile
    ? URL.createObjectURL(droppedFile)
    : originalSourceUrl || drawSourceUrl;

  const TypeIcon = PAGE_TYPE_ICONS[page.type] ?? Layers;
  const showText = hasText(page.type);
  const showDraw = hasDraw(page.type);
  const isCover = page.type === BookPageTypeEnum.COVER;
  const isBackCover = page.type === BookPageTypeEnum.BACK_COVER;
  const canEditText = showText || isCover || isBackCover;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: isActive ? 1 : 0.5, scale: isActive ? 1 : 0.97 }}
      transition={{ duration: 0.25 }}
      className='h-full'
    >
      <div className='flex h-full flex-col rounded-xl border border-border bg-card shadow-sm'>
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

          {/* Page status checkbox based on role */}
          {user?.role === UserRole.SCHOOL && (
            <div className='flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 border border-border/50'>
              <label
                htmlFor={`revise-page-${page.number}`}
                className={cn(
                  'text-xs font-semibold text-muted-foreground select-none',
                  isReadOnlyForSchool ? 'cursor-not-allowed' : 'cursor-pointer',
                )}
              >
                Marcar como revisado
              </label>
              <Checkbox
                id={`revise-page-${page.number}`}
                checked={
                  page.status === PageStatusEnum.REVISED_BY_SCHOOL ||
                  page.status === PageStatusEnum.READY
                }
                onCheckedChange={(checked) => {
                  if (isReadOnlyForSchool) return;
                  statusMutation.mutate(
                    checked
                      ? PageStatusEnum.REVISED_BY_SCHOOL
                      : PageStatusEnum.IN_PROGRESS,
                  );
                }}
                disabled={statusMutation.isPending || isReadOnlyForSchool}
              />
            </div>
          )}

          {user?.role === UserRole.ADMIN &&
            (() => {
              const isRevisedBySchool =
                page.status === PageStatusEnum.REVISED_BY_SCHOOL ||
                page.status === PageStatusEnum.READY;
              return (
                <div className='flex items-center gap-4 rounded-lg bg-muted/30 px-3 py-1.5 border border-border/50'>
                  <div className='flex items-center gap-2'>
                    <label
                      htmlFor={`revise-page-${page.number}`}
                      className='text-xs font-semibold text-muted-foreground select-none cursor-pointer'
                    >
                      Revisado pela escola
                    </label>
                    <Checkbox
                      id={`revise-page-${page.number}`}
                      checked={isRevisedBySchool}
                      disabled={statusMutation.isPending}
                      onCheckedChange={(checked) => {
                        statusMutation.mutate(
                          checked
                            ? PageStatusEnum.REVISED_BY_SCHOOL
                            : PageStatusEnum.IN_PROGRESS,
                        );
                      }}
                    />
                  </div>
                  <div className='h-4 w-px bg-border/60' />
                  <div className='flex items-center gap-2'>
                    <label
                      htmlFor={`ready-page-${page.number}`}
                      className={cn(
                        'text-xs font-semibold select-none',
                        isRevisedBySchool
                          ? 'text-muted-foreground cursor-pointer'
                          : 'text-muted-foreground/40 cursor-not-allowed',
                      )}
                    >
                      Pronto
                    </label>
                    <Checkbox
                      id={`ready-page-${page.number}`}
                      checked={page.status === PageStatusEnum.READY}
                      disabled={!isRevisedBySchool || statusMutation.isPending}
                      onCheckedChange={(checked) => {
                        statusMutation.mutate(
                          checked
                            ? PageStatusEnum.READY
                            : PageStatusEnum.REVISED_BY_SCHOOL,
                        );
                      }}
                    />
                  </div>
                </div>
              );
            })()}
        </div>

        {/* card body */}
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-5'>
          {/* draw image */}
          {showDraw && (
            <div className='relative'>
              <div className='flex items-center justify-between mb-2'>
                <p className='mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Desenho
                </p>
                {showDraw &&
                  (drawSourceUrl || originalSourceUrl) &&
                  !isImageEditorOpen &&
                  !isReadOnlyForSchool && (
                    <div className='flex items-center gap-1'>
                      <Button
                        variant={drawSourceUrl ? 'ghost' : 'outline'}
                        size='sm'
                        onClick={() => setIsImageEditorOpen(true)}
                        aria-label={
                          drawSourceUrl ? 'Editar corte' : 'Recortar imagem'
                        }
                        className={
                          drawSourceUrl
                            ? ''
                            : 'border-primary/40 text-primary hover:bg-primary/10'
                        }
                      >
                        <Crop className='size-3.5 mr-1.5' />
                        {drawSourceUrl ? 'Editar corte' : 'Recortar imagem'}
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => fileInputRef.current?.click()}
                        aria-label='Trocar imagem'
                      >
                        <FileImage className='size-3.5 mr-1.5' />
                        Trocar imagem
                      </Button>
                    </div>
                  )}
              </div>
              {drawSourceUrl ? (
                <div className='overflow-hidden rounded-xl border border-border/70 bg-muted/20'>
                  <img
                    key={drawSourceUrl}
                    src={drawSourceUrl}
                    alt={`Desenho da página ${page.number}`}
                    crossOrigin='anonymous'
                    className='w-full object-contain'
                    style={{ maxHeight: 320 }}
                  />
                </div>
              ) : originalSourceUrl ? (
                <div className='relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-primary/40 bg-muted/10 p-5 text-center transition-colors'>
                  <div className='relative max-h-64 w-full overflow-hidden rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center border border-border/50 group'>
                    <img
                      key={originalSourceUrl}
                      src={originalSourceUrl}
                      alt={`Folha original da página ${page.number}`}
                      crossOrigin='anonymous'
                      className='max-h-64 w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]'
                    />
                    {!isReadOnlyForSchool && (
                      <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                        <Button
                          size='sm'
                          onClick={() => setIsImageEditorOpen(true)}
                          className='shadow-lg'
                        >
                          <Crop className='size-4 mr-1.5' />
                          Recortar desenho
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className='flex flex-col items-center gap-1'>
                    <p className='text-sm font-medium text-foreground'>
                      Folha escaneada aguardando recorte
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Selecione a área do desenho na folha original para definir a imagem final do livro.
                    </p>
                  </div>
                  {!isReadOnlyForSchool && (
                    <Button
                      type='button'
                      onClick={() => setIsImageEditorOpen(true)}
                      className='mt-1'
                    >
                      <Crop className='size-4 mr-2' />
                      Recortar desenho agora
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-200 focus:outline-none',
                    isReadOnlyForSchool
                      ? 'border-border/50 bg-muted/10 text-muted-foreground/50 cursor-not-allowed'
                      : isDragging
                        ? 'border-primary bg-primary/5 text-primary cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2'
                        : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50 cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  )}
                  onDragOver={isReadOnlyForSchool ? undefined : handleDragOver}
                  onDragLeave={
                    isReadOnlyForSchool ? undefined : handleDragLeave
                  }
                  onDrop={isReadOnlyForSchool ? undefined : handleDrop}
                  onClick={
                    isReadOnlyForSchool
                      ? undefined
                      : () => fileInputRef.current?.click()
                  }
                  role={isReadOnlyForSchool ? undefined : 'button'}
                  tabIndex={isReadOnlyForSchool ? undefined : 0}
                  onKeyDown={
                    isReadOnlyForSchool
                      ? undefined
                      : (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }
                  }
                >
                  <div
                    className={cn(
                      'flex size-12 items-center justify-center rounded-xl transition-colors duration-200',
                      isReadOnlyForSchool
                        ? 'bg-muted/20 text-muted-foreground/30'
                        : isDragging
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <UploadCloud className='size-6' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-foreground'>
                      {isReadOnlyForSchool
                        ? 'Modificações desabilitadas'
                        : isDragging
                          ? 'Solte a imagem aqui'
                          : 'Arraste uma imagem ou clique para selecionar'}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {isReadOnlyForSchool
                        ? 'O livro está pronto e não pode ser alterado.'
                        : 'PNG, JPG, WEBP'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* text content */}
          {showText && (
            <div className='flex flex-1 flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Conteúdo de texto
                </p>
                {canEditText && !isEditing && !isReadOnlyForSchool && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setIsEditing(true)}
                    aria-label='Editar conteúdo'
                  >
                    <Pencil className='size-3.5' />
                    Editar texto
                  </Button>
                )}
                {canEditText && isEditing && (
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setDraft(page.textContent ?? '');
                        setTitleDraft(book.title ?? '');
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
              {isEditing ? (
                page.type === BookPageTypeEnum.PREFACE ? (
                  <div className='flex flex-col gap-4 w-full'>
                    <div className='flex flex-col gap-1.5'>
                      <label className='text-xs font-semibold text-muted-foreground'>
                        Gênero Textual
                      </label>
                      <Input
                        value={bookGenreDraft}
                        onChange={(e) => setBookGenreDraft(e.target.value)}
                        placeholder='Ex: Fábula, Poesia...'
                        className='text-sm'
                        autoFocus
                      />
                    </div>
                    <div className='flex flex-col gap-1.5'>
                      <label className='text-xs font-semibold text-muted-foreground'>
                        Explicação do Gênero
                      </label>
                      <Textarea
                        value={bookGenreExplanationDraft}
                        onChange={(e) =>
                          setBookGenreExplanationDraft(e.target.value)
                        }
                        placeholder='Explicação curta sobre o gênero textual...'
                        className='min-h-32 resize-none text-sm'
                      />
                    </div>
                  </div>
                ) : page.type === BookPageTypeEnum.THANKS ? (
                  <div className='flex flex-col gap-4 w-full'>
                    <div className='flex flex-col gap-1.5'>
                      <label className='text-xs font-semibold text-muted-foreground'>
                        Mensagem da Escola
                      </label>
                      <Textarea
                        value={schoolMessageDraft}
                        onChange={(e) => setSchoolMessageDraft(e.target.value)}
                        placeholder='Mensagem introdutória da escola...'
                        className='min-h-24 resize-none text-sm'
                        autoFocus
                      />
                    </div>
                    <div className='flex flex-col gap-1.5'>
                      <label className='text-xs font-semibold text-muted-foreground'>
                        Agradecimentos
                      </label>
                      <Textarea
                        value={thanksMessageDraft}
                        onChange={(e) => setThanksMessageDraft(e.target.value)}
                        placeholder='Mensagem de agradecimento...'
                        className='min-h-24 resize-none text-sm'
                      />
                    </div>
                    <div className='flex flex-col gap-1.5'>
                      <label className='text-xs font-semibold text-muted-foreground'>
                        Equipe Escolar (Formato Cargo: Nome, um por linha)
                      </label>
                      <Textarea
                        value={schoolTeamDraft}
                        onChange={(e) => setSchoolTeamDraft(e.target.value)}
                        placeholder='Ex: Professora: Keila Marli&#10;Coordenadora: Flávia Nobre'
                        className='min-h-32 resize-none text-sm'
                      />
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder='Digite o conteúdo desta página...'
                    className='min-h-40 flex-1 resize-none text-sm'
                    autoFocus
                  />
                )
              ) : page.type === BookPageTypeEnum.PREFACE ? (
                book.class.bookGenre || book.class.bookGenreExplanation ? (
                  <div className='space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-foreground w-full'>
                    {book.class.bookGenre && (
                      <div>
                        <h4 className='font-semibold text-primary text-xs uppercase tracking-wider mb-1'>
                          Gênero Textual
                        </h4>
                        <p>{book.class.bookGenre}</p>
                      </div>
                    )}
                    {book.class.bookGenreExplanation && (
                      <div>
                        <h4 className='font-semibold text-primary text-xs uppercase tracking-wider mb-1'>
                          Explicação do Gênero
                        </h4>
                        <p className='whitespace-pre-wrap'>
                          {book.class.bookGenreExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground w-full'>
                    <FileText className='size-5' />
                    <p className='text-xs'>Sem conteúdo de prefácio</p>
                  </div>
                )
              ) : page.type === BookPageTypeEnum.THANKS ? (
                book.class.schoolMessage ||
                book.class.thanksMessage ||
                book.class.schoolTeam ? (
                  <div className='space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-foreground w-full'>
                    {book.class.schoolMessage && (
                      <div>
                        <h4 className='font-semibold text-primary text-xs uppercase tracking-wider mb-1'>
                          Mensagem da Escola
                        </h4>
                        <p className='whitespace-pre-wrap'>
                          {book.class.schoolMessage}
                        </p>
                      </div>
                    )}
                    {book.class.thanksMessage && (
                      <div>
                        <h4 className='font-semibold text-primary text-xs uppercase tracking-wider mb-1'>
                          Agradecimentos
                        </h4>
                        <p className='whitespace-pre-wrap'>
                          {book.class.thanksMessage}
                        </p>
                      </div>
                    )}
                    {book.class.schoolTeam && (
                      <div>
                        <h4 className='font-semibold text-primary text-xs uppercase tracking-wider mb-1'>
                          Equipe Escolar
                        </h4>
                        <p className='whitespace-pre-wrap'>
                          {book.class.schoolTeam}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground w-full'>
                    <FileText className='size-5' />
                    <p className='text-xs'>Sem conteúdo de agradecimentos</p>
                  </div>
                )
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

          {/* cover special fields */}
          {isCover && (
            <div className='flex flex-1 flex-col gap-6'>
              {/* Title */}
              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    Título do Livro
                  </p>
                  {canEditText && !isEditing && !isReadOnlyForSchool && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setIsEditing(true)}
                      aria-label='Editar conteúdo'
                    >
                      <Pencil className='size-3.5' />
                      Editar título
                    </Button>
                  )}
                  {canEditText && isEditing && (
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setDraft(page.textContent ?? '');
                          setTitleDraft(book.title ?? '');
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
                {isEditing ? (
                  <Textarea
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    placeholder='Digite o título do livro...'
                    className='min-h-20 resize-none text-sm'
                    autoFocus
                  />
                ) : book.title ? (
                  <p className='whitespace-pre-wrap rounded-xl border border-border/70 bg-muted/20 p-4 text-sm font-semibold text-foreground'>
                    {book.title}
                  </p>
                ) : (
                  <div className='flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground'>
                    <FileText className='size-5' />
                    <p className='text-xs'>Sem título definido</p>
                  </div>
                )}
              </div>

              {/* School Logo */}
              <div className='flex flex-col gap-2'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Logo da Escola
                </p>
                <div className='flex items-center gap-4 rounded-xl border border-border/70 bg-muted/20 p-4'>
                  <div className='flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-background'>
                    {book.unit.logoUrl ? (
                      <img
                        src={book.unit.logoUrl}
                        alt='Logo da escola'
                        className='h-full w-full object-contain'
                      />
                    ) : (
                      <School className='size-6 text-muted-foreground' />
                    )}
                  </div>
                  <div className='flex flex-col gap-2 items-start'>
                    <p className='text-sm text-muted-foreground'>
                      {book.unit.logoUrl
                        ? 'Logo atual da escola.'
                        : 'Nenhum logo cadastrado.'}
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => logoInputRef.current?.click()}
                      disabled={
                        uploadLogoMutation.isPending || isReadOnlyForSchool
                      }
                    >
                      {uploadLogoMutation.isPending ? (
                        <Loader2 className='size-3.5 animate-spin mr-2' />
                      ) : (
                        <UploadCloud className='size-3.5 mr-2' />
                      )}
                      {book.unit.logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
                    </Button>
                    <input
                      type='file'
                      ref={logoInputRef}
                      className='hidden'
                      accept='image/*'
                      disabled={isReadOnlyForSchool}
                      onChange={(e) => {
                        if (isReadOnlyForSchool) return;
                        const file = e.target.files?.[0];
                        if (file) uploadLogoMutation.mutate(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isBackCover && (
            <div className='flex flex-1 flex-col gap-6 md:flex-row md:items-start'>
              {/* Biografia do(a) autor(a) */}
              <div className='flex flex-1 flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    Biografia do(a) autor(a)
                  </p>
                  {canEditText && !isEditing && !isReadOnlyForSchool && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setIsEditing(true)}
                      aria-label='Editar biografia do(a) autor(a)'
                    >
                      <Pencil className='size-3.5' />
                      Editar biografia
                    </Button>
                  )}
                  {canEditText && isEditing && (
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setDraft(page.textContent ?? '');
                          setTitleDraft(book.title ?? '');
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
                {isEditing ? (
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder='Digite a biografia do(a) autor(a)...'
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

              {/* Foto do(a) Aluno(a) */}
              <div className='flex flex-col gap-2 md:w-64 shrink-0'>
                <div className='flex items-center justify-between'>
                  <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    Foto do(a) Aluno(a)
                  </p>
                  {(drawSourceUrl || originalSourceUrl) &&
                    !isImageEditorOpen &&
                    !isReadOnlyForSchool && (
                      <div className='flex gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 px-2'
                          onClick={() => setIsImageEditorOpen(true)}
                          aria-label={
                            drawSourceUrl ? 'Editar foto' : 'Recortar foto'
                          }
                        >
                          <Crop className='size-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 px-2'
                          onClick={() => fileInputRef.current?.click()}
                          aria-label='Trocar foto'
                        >
                          <FileImage className='size-3.5' />
                        </Button>
                      </div>
                    )}
                </div>

                {drawSourceUrl ? (
                  <div className='overflow-hidden rounded-xl border border-border/70 bg-muted/20 aspect-[3/4] relative group'>
                    <img
                      key={drawSourceUrl}
                      src={drawSourceUrl}
                      alt='Foto do(a) aluno(a)'
                      crossOrigin='anonymous'
                      className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                    {!isReadOnlyForSchool && (
                      <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2'>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() => setIsImageEditorOpen(true)}
                        >
                          <Crop className='size-3.5 mr-1.5' />
                          Editar
                        </Button>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FileImage className='size-3.5 mr-1.5' />
                          Alterar
                        </Button>
                      </div>
                    )}
                  </div>
                ) : originalSourceUrl ? (
                  <div className='overflow-hidden rounded-xl border-2 border-dashed border-primary/40 bg-muted/10 aspect-[3/4] relative group flex flex-col items-center justify-center p-3'>
                    <img
                      key={originalSourceUrl}
                      src={originalSourceUrl}
                      alt='Foto original do(a) aluno(a)'
                      crossOrigin='anonymous'
                      className='w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity'
                    />
                    {!isReadOnlyForSchool && (
                      <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-2'>
                        <Button
                          size='sm'
                          onClick={() => setIsImageEditorOpen(true)}
                          className='shadow-lg'
                        >
                          <Crop className='size-3.5 mr-1.5' />
                          Recortar foto
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 text-center transition-colors duration-200 focus:outline-none aspect-[3/4]',
                      isReadOnlyForSchool
                        ? 'border-border/50 bg-muted/10 text-muted-foreground/50 cursor-not-allowed'
                        : isDragging
                          ? 'border-primary bg-primary/5 text-primary cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50 cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    )}
                    onDragOver={
                      isReadOnlyForSchool ? undefined : handleDragOver
                    }
                    onDragLeave={
                      isReadOnlyForSchool ? undefined : handleDragLeave
                    }
                    onDrop={isReadOnlyForSchool ? undefined : handleDrop}
                    onClick={
                      isReadOnlyForSchool
                        ? undefined
                        : () => fileInputRef.current?.click()
                    }
                    role={isReadOnlyForSchool ? undefined : 'button'}
                    tabIndex={isReadOnlyForSchool ? undefined : 0}
                    onKeyDown={
                      isReadOnlyForSchool
                        ? undefined
                        : (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              fileInputRef.current?.click();
                            }
                          }
                    }
                  >
                    <div
                      className={cn(
                        'flex size-12 items-center justify-center rounded-xl transition-colors duration-200',
                        isReadOnlyForSchool
                          ? 'bg-muted/20 text-muted-foreground/30'
                          : isDragging
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <UploadCloud className='size-6' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-foreground'>
                        {isReadOnlyForSchool
                          ? 'Modificações desabilitadas'
                          : isDragging
                            ? 'Solte a foto aqui'
                            : 'Arraste a foto ou clique'}
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {isReadOnlyForSchool
                          ? 'O livro está pronto e não pode ser alterado.'
                          : 'Proporção 3x4 (PNG, JPG)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* blank / cover / etc. */}
          {!showText && !showDraw && !isCover && !isBackCover && (
            <div className='flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground'>
              <p className='text-xs'>
                {PAGE_TYPE_LABELS[page.type]} — sem conteúdo
              </p>
            </div>
          )}
        </div>

        <input
          type='file'
          ref={fileInputRef}
          className='hidden'
          accept='image/*'
          onChange={handleFileChange}
          disabled={isReadOnlyForSchool}
        />

        <BookImageEditorDialog
          open={isImageEditorOpen && !isReadOnlyForSchool}
          onOpenChange={(open) => {
            if (isReadOnlyForSchool) {
              setIsImageEditorOpen(false);
              return;
            }
            setIsImageEditorOpen(open);
            if (!open) {
              setDroppedFile(null);
            }
          }}
          sourceUrl={editorSourceUrl}
          pageNumber={page.number}
          aspect={isBackCover ? 3 / 4 : 1}
          onSave={async (file) => {
            if (isReadOnlyForSchool) {
              enqueueSnackbar(
                getErrorMessageByKey(ErrorKeys.FORBIDDEN_BOOK_READY),
                { variant: 'error' },
              );
              return;
            }
            await saveDrawMutation.mutateAsync({
              file,
              originalFile: droppedFile || undefined,
            });
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
  const { user } = useAuth();

  const {
    data: book,
    isLoading,
    error,
    refetch,
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
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
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
          <div className='flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm'>
            <Loader2 className='size-5 animate-spin text-primary' />
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
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive shadow-sm'>
            <p className='text-sm font-medium'>
              {error ? getErrorMessage(error) : 'Livro não encontrado.'}
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

  const isBookReadyForSchool = book
    ? FORBIDDEN_BOOK_STATUSES_FOR_SCHOOL.includes(book.status)
    : false;
  const isReadOnlyForSchool =
    user?.role === UserRole.SCHOOL && isBookReadyForSchool;

  const statusCfg = getBookStatusConfig(book.status);
  const StatusIcon = statusCfg.icon;

  return (
    <main className='flex-1 overflow-auto'>
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
        {isReadOnlyForSchool && (
          <Alert variant='warning' className='mb-6'>
            <AlertCircle className='size-4' />
            <AlertTitle>Modificações Desabilitadas</AlertTitle>
            <AlertDescription>
              Este livro está finalizado (status Pronto). Usuários com perfil da
              escola não podem fazer modificações em livros finalizados.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Header ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6'
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
                    <StatusIcon className='size-3' />
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
                  {book.student.name}
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
          <div className='mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground'>
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
                    book={book}
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
