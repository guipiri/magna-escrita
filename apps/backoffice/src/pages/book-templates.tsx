import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
  Palette,
  FileText,
} from 'lucide-react';
import type {
  BookPageType,
  BookTemplatePage,
  BookTemplateResponse,
  CreateBookTemplateRequest,
  UpdateBookTemplateRequest,
} from '@repo/shared';
import { BOOK_PAGE_TYPES, BookPageTypeEnum } from '@repo/shared';
import {
  createBookTemplate,
  getBookTemplates,
  updateBookTemplate,
  getBookTemplateThemes,
  createBookTemplateTheme,
} from '../services/book-templates-service';
import { getSchoolUnits } from '../services/schools-service';
import { getErrorMessage } from '../services/error-messages';

const PAGE_TYPE_LABELS: Record<BookPageType, string> = {
  [BookPageTypeEnum.COVER]: 'Capa',
  [BookPageTypeEnum.TEXT]: 'Texto',
  [BookPageTypeEnum.DRAW]: 'Desenho',
  [BookPageTypeEnum.DRAW_TEXT]: 'Desenho + Texto',
  [BookPageTypeEnum.BLANK]: 'Em Branco',
  [BookPageTypeEnum.PREFACE]: 'Prefácio',
  [BookPageTypeEnum.THANKS]: 'Agradecimentos',
  [BookPageTypeEnum.BACK_COVER]: 'Contra-capa',
};

const PAGE_TYPE_COLORS: Record<BookPageType, string> = {
  [BookPageTypeEnum.COVER]: 'bg-violet-100 text-violet-700',
  [BookPageTypeEnum.TEXT]: 'bg-blue-100 text-blue-700',
  [BookPageTypeEnum.DRAW]: 'bg-green-100 text-green-700',
  [BookPageTypeEnum.DRAW_TEXT]: 'bg-teal-100 text-teal-700',
  [BookPageTypeEnum.BLANK]: 'bg-muted text-muted-foreground',
  [BookPageTypeEnum.PREFACE]: 'bg-orange-100 text-orange-700',
  [BookPageTypeEnum.THANKS]: 'bg-pink-100 text-pink-700',
  [BookPageTypeEnum.BACK_COVER]: 'bg-indigo-100 text-indigo-700',
};

function TemplateCard({
  template,
  allUnits,
  onEdit,
}: {
  template: BookTemplateResponse;
  allUnits: Array<{ id: string; name: string }>;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const unitNames =
    template.units
      ?.map((uid) => allUnits.find((u) => u.id === uid)?.name)
      .filter(Boolean) ?? [];

  return (
    <div className='rounded-xl border border-border bg-card shadow-sm overflow-hidden'>
      <button
        type='button'
        onClick={() => setExpanded((prev) => !prev)}
        className='w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-accent/50 transition-colors'
      >
        <div className='flex items-center gap-3 min-w-0'>
          <span className='shrink-0 w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center'>
            <BookOpen className='w-4 h-4 text-violet-600' />
          </span>
          <div className='min-w-0'>
            <p className='font-medium text-foreground truncate'>
              {template.name}
            </p>
            <p className='text-xs text-muted-foreground'>
              {template.pageCount} página
              {template.pageCount !== 1 ? 's' : ''}
            </p>
            {template.bookTemplateTheme && (
              <div className='flex items-center gap-1.5 mt-1'>
                <span
                  className='w-2.5 h-2.5 rounded-full border border-black/10 shrink-0'
                  style={{
                    backgroundColor:
                      template.bookTemplateTheme.colorTheme || '#ccc',
                  }}
                />
                <span className='text-xs text-muted-foreground font-medium truncate'>
                  Tema: {template.bookTemplateTheme.name}
                </span>
                {template.bookTemplateTheme.coverThemePdfUrl && (
                  <a
                    href={template.bookTemplateTheme.coverThemePdfUrl}
                    target='_blank'
                    rel='noreferrer'
                    onClick={(e) => e.stopPropagation()}
                    className='text-[10px] text-primary hover:underline flex items-center gap-0.5 ml-2'
                  >
                    <FileText className='w-3 h-3' />
                    PDF
                  </a>
                )}
              </div>
            )}
            {unitNames.length > 0 ? (
              <div className='flex flex-wrap gap-1 mt-1.5'>
                {unitNames.map((name) => (
                  <span
                    key={name}
                    className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border/30'
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className='text-xs text-muted-foreground mt-1'>
                Nenhuma unidade associada
              </p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className='px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-card text-foreground hover:bg-accent transition-colors'
          >
            Editar
          </button>
          {expanded ? (
            <ChevronUp className='w-4 h-4 text-muted-foreground shrink-0' />
          ) : (
            <ChevronDown className='w-4 h-4 text-muted-foreground shrink-0' />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key='pages'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='overflow-hidden'
          >
            <div className='px-5 pb-4 border-t border-border'>
              <div className='mt-3 overflow-x-auto rounded-lg border border-border'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-muted/60'>
                      <th className='px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-24'>
                        Página
                      </th>
                      <th className='px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.pages.map((page) => (
                      <tr
                        key={page.pageNumber}
                        className='border-t border-border hover:bg-muted/30'
                      >
                        <td className='px-4 py-2 font-mono text-sm text-muted-foreground'>
                          {page.pageNumber}
                        </td>
                        <td className='px-4 py-2'>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PAGE_TYPE_COLORS[page.pageType] ?? 'bg-muted text-muted-foreground'}`}
                          >
                            {PAGE_TYPE_LABELS[page.pageType] ?? page.pageType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type NewPage = { pageNumber: number; pageType: string };

const DEFAULT_INITIAL_PAGES: NewPage[] = [
  { pageNumber: 0, pageType: BookPageTypeEnum.COVER },
  { pageNumber: 1, pageType: BookPageTypeEnum.TEXT },
  { pageNumber: 2, pageType: BookPageTypeEnum.DRAW },
  { pageNumber: 3, pageType: BookPageTypeEnum.TEXT },
  { pageNumber: 4, pageType: BookPageTypeEnum.DRAW },
  { pageNumber: 5, pageType: BookPageTypeEnum.BACK_COVER },
];

function TemplatePanel({
  open,
  onClose,
  template,
}: {
  open: boolean;
  onClose: () => void;
  template?: BookTemplateResponse | null;
}) {
  const [name, setName] = useState('');
  const [pages, setPages] = useState<NewPage[]>(DEFAULT_INITIAL_PAGES);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [showCreateTheme, setShowCreateTheme] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeColor, setNewThemeColor] = useState('#6366f1');
  const [newThemeFile, setNewThemeFile] = useState<File | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: schools } = useQuery({
    queryKey: ['school-units'],
    queryFn: getSchoolUnits,
  });

  const { data: themes } = useQuery({
    queryKey: ['book-templates-themes'],
    queryFn: getBookTemplateThemes,
    enabled: open,
  });

  const createThemeMutation = useMutation({
    mutationFn: createBookTemplateTheme,
  });

  const allUnits =
    schools?.flatMap((school) =>
      school.units.map((unit) => ({
        id: unit.id,
        name: `${school.name} - ${unit.name || 'Sem nome'}`,
      })),
    ) ?? [];

  useEffect(() => {
    if (template) {
      setName(template.name);
      setPages(
        template.pages.map((p) => ({
          pageNumber: p.pageNumber,
          pageType: p.pageType,
        })),
      );
      setSelectedUnits(template.units || []);
      setSelectedThemeId(template.bookTemplateThemeId || '');
    } else {
      setName('');
      setPages(DEFAULT_INITIAL_PAGES);
      setSelectedUnits([]);
      setSelectedThemeId('');
    }
    setShowCreateTheme(false);
    setNewThemeName('');
    setNewThemeColor('#6366f1');
    setNewThemeFile(null);
    setThemeError(null);
    setFormError(null);
  }, [template, open]);

  const resetForm = () => {
    setName('');
    setPages(DEFAULT_INITIAL_PAGES);
    setSelectedUnits([]);
    setSelectedThemeId('');
    setShowCreateTheme(false);
    setNewThemeName('');
    setNewThemeColor('#6366f1');
    setNewThemeFile(null);
    setThemeError(null);
    setFormError(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateBookTemplateRequest) => createBookTemplate(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['book-templates'] });
      resetForm();
      onClose();
    },
    onError: (err) => {
      setFormError(
        getErrorMessage(err) || 'Erro ao criar template. Tente novamente.',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: UpdateBookTemplateRequest }) =>
      updateBookTemplate(data.id, data.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['book-templates'] });
      resetForm();
      onClose();
    },
    onError: (err) => {
      setFormError(
        getErrorMessage(err) || 'Erro ao salvar template. Tente novamente.',
      );
    },
  });

  const addPage = () => {
    setPages((prev) => {
      const newPages = [...prev];
      const backCoverIndex = newPages.length - 1;
      newPages.splice(backCoverIndex, 0, {
        pageNumber: 0,
        pageType: BookPageTypeEnum.TEXT,
      });
      return newPages.map((p, i) => ({ ...p, pageNumber: i }));
    });
  };

  const removePage = (index: number) => {
    if (index === 0 || index === pages.length - 1) return;
    setPages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((p, i) => ({ ...p, pageNumber: i }));
    });
  };

  const updatePageType = (index: number, pageType: string) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, pageType } : p)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('O nome do template é obrigatório.');
      return;
    }
    if (pages.length === 0) {
      setFormError('Adicione ao menos uma página.');
      return;
    }

    // Client-side page validations
    if (pages[0].pageType !== BookPageTypeEnum.COVER) {
      setFormError('A primeira página deve ser do tipo Capa.');
      return;
    }
    if (pages[pages.length - 1].pageType !== BookPageTypeEnum.BACK_COVER) {
      setFormError('A última página deve ser do tipo Contra-capa.');
      return;
    }
    const interiorCount = pages.length - 2;
    if (interiorCount < 0 || interiorCount % 4 !== 0) {
      setFormError(
        `O total de páginas internas (excluindo capa e contra-capa) deve ser múltiplo de 4. Atualmente há ${interiorCount} páginas internas.`,
      );
      return;
    }

    // Verify intermediate pages do not contain COVER or BACK_COVER
    for (let i = 1; i < pages.length - 1; i++) {
      if (
        pages[i].pageType === BookPageTypeEnum.COVER ||
        pages[i].pageType === BookPageTypeEnum.BACK_COVER
      ) {
        setFormError(
          'O miolo do livro não pode conter páginas do tipo Capa ou Contra-capa.',
        );
        return;
      }
    }

    let themeIdToUse = selectedThemeId;

    if (showCreateTheme) {
      if (!newThemeName.trim()) {
        setFormError('O nome do novo tema é obrigatório.');
        return;
      }
      if (!newThemeColor.trim()) {
        setFormError('A cor do novo tema é obrigatória.');
        return;
      }
      if (!newThemeFile) {
        setFormError('O PDF do tema é obrigatório.');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('name', newThemeName.trim());
        formData.append('colorTheme', newThemeColor.trim());
        formData.append('coverThemePdf', newThemeFile);

        const newTheme = await createThemeMutation.mutateAsync(formData);
        themeIdToUse = newTheme.id;
        void queryClient.invalidateQueries({
          queryKey: ['book-templates-themes'],
        });

        setShowCreateTheme(false);
        setNewThemeName('');
        setNewThemeColor('#6366f1');
        setNewThemeFile(null);
        setSelectedThemeId(newTheme.id);
      } catch (err) {
        setFormError(getErrorMessage(err) || 'Erro ao criar novo tema.');
        return;
      }
    }

    if (!themeIdToUse) {
      setFormError('Selecione ou crie um tema para associar com o template.');
      return;
    }

    const payload = {
      name: name.trim(),
      pages: pages as BookTemplatePage[],
      units: selectedUnits,
      bookTemplateThemeId: themeIdToUse,
    };

    if (template) {
      updateMutation.mutate({ id: template.id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    createThemeMutation.isPending;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key='backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/20 backdrop-blur-sm z-40'
            onClick={onClose}
          />
          <motion.aside
            key='panel'
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className='fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col'
          >
            <header className='flex items-center justify-between px-6 py-4 border-b border-border'>
              <h2 className='text-base font-semibold text-foreground'>
                {template ? 'Editar Template' : 'Novo Template'}
              </h2>
              <button
                type='button'
                onClick={onClose}
                className='p-1.5 rounded-md hover:bg-accent transition-colors'
                aria-label='Fechar painel'
              >
                <X className='w-4 h-4 text-muted-foreground' />
              </button>
            </header>

            <form
              onSubmit={handleSubmit}
              className='flex flex-col flex-1 overflow-hidden'
            >
              <div className='flex-1 overflow-y-auto px-6 py-4 space-y-5'>
                {/* Name */}
                <div>
                  <label
                    htmlFor='template-name'
                    className='block text-sm font-medium text-foreground mb-1.5'
                  >
                    Nome do template
                  </label>
                  <input
                    id='template-name'
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='Ex: Livro Infantil 20 páginas'
                    className='w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm'
                  />
                </div>

                {/* Theme Selection */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <label
                      htmlFor='template-theme'
                      className='block text-sm font-medium text-foreground'
                    >
                      Tema do Template
                    </label>
                    <button
                      type='button'
                      onClick={() => {
                        setShowCreateTheme((prev) => !prev);
                        setThemeError(null);
                      }}
                      className='text-xs text-primary font-medium hover:underline flex items-center gap-1'
                    >
                      <Palette className='w-3 h-3' />
                      {showCreateTheme
                        ? 'Selecionar existente'
                        : '+ Criar Novo Tema'}
                    </button>
                  </div>

                  {!showCreateTheme ? (
                    <select
                      id='template-theme'
                      value={selectedThemeId}
                      onChange={(e) => setSelectedThemeId(e.target.value)}
                      className='w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm'
                    >
                      <option value=''>Selecione um tema...</option>
                      {themes?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className='border border-border rounded-lg p-3.5 space-y-3 bg-muted/10'>
                      <div className='flex items-center justify-between border-b border-border pb-1.5'>
                        <h4 className='text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5'>
                          <Palette className='w-3.5 h-3.5 text-primary' />
                          Novo Tema
                        </h4>
                      </div>
                      <div>
                        <label
                          htmlFor='new-theme-name'
                          className='block text-xs font-medium text-muted-foreground mb-1'
                        >
                          Nome do Tema
                        </label>
                        <input
                          id='new-theme-name'
                          type='text'
                          value={newThemeName}
                          onChange={(e) => setNewThemeName(e.target.value)}
                          placeholder='Ex: Selva Mágica'
                          className='w-full px-3 py-1.5 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-xs'
                        />
                      </div>
                      <div>
                        <label
                          htmlFor='new-theme-color'
                          className='block text-xs font-medium text-muted-foreground mb-1'
                        >
                          Cor do Tema (Hexadecimal)
                        </label>
                        <div className='flex gap-2 items-center'>
                          <input
                            id='new-theme-color'
                            type='text'
                            value={newThemeColor}
                            onChange={(e) => setNewThemeColor(e.target.value)}
                            placeholder='Ex: #6366f1'
                            className='flex-1 px-3 py-1.5 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-xs'
                          />
                          <input
                            type='color'
                            value={
                              newThemeColor.startsWith('#') &&
                              newThemeColor.length === 7
                                ? newThemeColor
                                : '#6366f1'
                            }
                            onChange={(e) => setNewThemeColor(e.target.value)}
                            className='w-8 h-8 rounded border border-border cursor-pointer bg-transparent'
                            aria-label='Seletor de cor do tema'
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor='new-theme-file'
                          className='block text-xs font-medium text-muted-foreground mb-1'
                        >
                          PDF da Capa (.pdf)
                        </label>
                        <input
                          id='new-theme-file'
                          type='file'
                          accept='.pdf'
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setNewThemeFile(file);
                          }}
                          className='w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer'
                        />
                      </div>
                      {themeError && (
                        <p className='text-xs text-destructive flex items-center gap-1 mt-1'>
                          <AlertCircle className='w-3.5 h-3.5 shrink-0' />
                          {themeError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Units selection */}
                <div>
                  <label className='block text-sm font-medium text-foreground mb-1.5'>
                    Unidades Associadas
                  </label>
                  <div className='max-h-40 overflow-y-auto border border-border rounded-lg p-3 space-y-2 bg-muted/10'>
                    {allUnits.length === 0 ? (
                      <p className='text-xs text-muted-foreground'>
                        Nenhuma unidade cadastrada.
                      </p>
                    ) : (
                      allUnits.map((unit) => {
                        const isChecked = selectedUnits.includes(unit.id);
                        const isUnitDisabled =
                          template?.unitsWithBooks?.includes(unit.id);
                        return (
                          <label
                            key={unit.id}
                            className={`flex items-start gap-2.5 text-sm font-normal text-foreground select-none ${isUnitDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <input
                              type='checkbox'
                              checked={isChecked}
                              disabled={isUnitDisabled}
                              onChange={() => {
                                setSelectedUnits((prev) =>
                                  isChecked
                                    ? prev.filter((id) => id !== unit.id)
                                    : [...prev, unit.id],
                                );
                              }}
                              className='mt-1 rounded border-border text-primary focus:ring-ring disabled:opacity-50'
                            />
                            <span>
                              {unit.name}{' '}
                              {isUnitDisabled && (
                                <span className='text-xs text-amber-600 font-medium'>
                                  (Possui livros)
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Pages */}
                <div>
                  <div className='flex items-center justify-between mb-2'>
                    <label className='block text-sm font-medium text-foreground'>
                      Páginas ({pages.length})
                    </label>
                    {!template?.hasBooks && (
                      <button
                        type='button'
                        onClick={addPage}
                        className='flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors'
                      >
                        <Plus className='w-3.5 h-3.5' />
                        Adicionar
                      </button>
                    )}
                  </div>

                  {template?.hasBooks && (
                    <div className='flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3 border border-amber-200/50'>
                      <AlertCircle className='w-4 h-4 shrink-0' />
                      Este template possui livros vinculados. Suas páginas não
                      podem ser alteradas.
                    </div>
                  )}

                  <div className='space-y-2'>
                    {pages.map((page, idx) => {
                      const isFirstOrLast =
                        idx === 0 || idx === pages.length - 1;
                      return (
                        <div
                          key={idx}
                          className='flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30'
                        >
                          <span className='w-7 text-center text-xs font-mono text-muted-foreground shrink-0'>
                            {page.pageNumber}
                          </span>
                          <select
                            value={page.pageType}
                            disabled={template?.hasBooks || isFirstOrLast}
                            onChange={(e) =>
                              updatePageType(idx, e.target.value)
                            }
                            className='flex-1 text-sm px-2 py-1.5 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-75 disabled:bg-muted/40'
                            aria-label={`Tipo da página ${page.pageNumber}`}
                          >
                            {BOOK_PAGE_TYPES.filter((type) => {
                              if (isFirstOrLast) return true;
                              return (
                                type !== BookPageTypeEnum.COVER &&
                                type !== BookPageTypeEnum.BACK_COVER
                              );
                            }).map((type) => (
                              <option key={type} value={type}>
                                {PAGE_TYPE_LABELS[type] ?? type}
                              </option>
                            ))}
                          </select>
                          {!template?.hasBooks && !isFirstOrLast && (
                            <button
                              type='button'
                              onClick={() => removePage(idx)}
                              className='p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors'
                              aria-label={`Remover página ${page.pageNumber}`}
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {formError && (
                  <div className='flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2'>
                    <AlertCircle className='w-4 h-4 shrink-0' />
                    {formError}
                  </div>
                )}
              </div>

              <div className='px-6 py-4 border-t border-border'>
                <button
                  type='submit'
                  disabled={isPending}
                  className='w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isPending
                    ? template
                      ? 'Salvando...'
                      : 'Criando...'
                    : template
                      ? 'Salvar Alterações'
                      : 'Criar Template'}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function BookTemplatesPage() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<BookTemplateResponse | null>(null);

  const { data, isLoading, error } = useQuery<BookTemplateResponse[]>({
    queryKey: ['book-templates'],
    queryFn: getBookTemplates,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: schools } = useQuery({
    queryKey: ['school-units'],
    queryFn: getSchoolUnits,
  });

  const allUnits =
    schools?.flatMap((school) =>
      school.units.map((unit) => ({
        id: unit.id,
        name: `${school.name} - ${unit.name || 'Sem nome'}`,
      })),
    ) ?? [];

  const templates = data ?? [];

  const handleOpenCreatePanel = () => {
    setEditingTemplate(null);
    setPanelOpen(true);
  };

  const handleOpenEditPanel = (template: BookTemplateResponse) => {
    setEditingTemplate(template);
    setPanelOpen(true);
  };

  return (
    <main className='flex-1 overflow-auto'>
      <div className='mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8'>
        {/* Page header */}
        <section className='rounded-3xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6 mb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
                Book Templates
              </h1>
              <p className='mt-1 text-sm text-muted-foreground'>
                {templates.length} template
                {templates.length !== 1 ? 's' : ''} cadastrado
                {templates.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              type='button'
              onClick={handleOpenCreatePanel}
              className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0'
            >
              <Plus className='w-4 h-4' />
              Novo Template
            </button>
          </div>
        </section>

        {/* Loading / Error / Content */}
        {isLoading ? (
          <div className='rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm'>
            Carregando templates...
          </div>
        ) : error ? (
          <div className='rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 shadow-sm'>
            Não foi possível carregar os templates agora.
          </div>
        ) : templates.length === 0 ? (
          <div className='rounded-xl border border-border bg-card p-10 text-center shadow-sm'>
            <BookOpen className='w-9 h-9 text-muted-foreground mx-auto mb-3' />
            <p className='text-sm text-muted-foreground'>
              Nenhum template criado ainda.
            </p>
            <button
              type='button'
              onClick={handleOpenCreatePanel}
              className='mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-accent transition-colors'
            >
              <Plus className='w-4 h-4' />
              Criar primeiro template
            </button>
          </div>
        ) : (
          <div className='space-y-3'>
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                allUnits={allUnits}
                onEdit={() => handleOpenEditPanel(template)}
              />
            ))}
          </div>
        )}
      </div>

      <TemplatePanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
      />
    </main>
  );
}
