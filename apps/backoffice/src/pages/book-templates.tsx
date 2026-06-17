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
} from 'lucide-react';
import type {
  BookTemplatePage,
  BookTemplateResponse,
  CreateBookTemplateRequest,
  UpdateBookTemplateRequest,
} from '@repo/shared';
import { BOOK_PAGE_TYPES } from '@repo/shared';
import {
  createBookTemplate,
  getBookTemplates,
  updateBookTemplate,
} from '../services/book-templates-service';
import { getSchoolUnits } from '../services/schools-service';
import { getErrorMessage } from '../services/error-messages';

const PAGE_TYPE_LABELS: Record<string, string> = {
  COVER: 'Capa',
  TEXT: 'Texto',
  DRAW: 'Desenho',
  DRAW_TEXT: 'Desenho + Texto',
  BLANK: 'Em Branco',
  PREFACE: 'Prefácio',
  THANKS: 'Agradecimentos',
  BACK_COVER: 'Contra-capa',
};

const PAGE_TYPE_COLORS: Record<string, string> = {
  COVER: 'bg-violet-100 text-violet-700',
  TEXT: 'bg-blue-100 text-blue-700',
  DRAW: 'bg-green-100 text-green-700',
  DRAW_TEXT: 'bg-teal-100 text-teal-700',
  BLANK: 'bg-muted text-muted-foreground',
  PREFACE: 'bg-orange-100 text-orange-700',
  THANKS: 'bg-pink-100 text-pink-700',
  BACK_COVER: 'bg-indigo-100 text-indigo-700',
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

  const unitNames = template.units
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
  const [pages, setPages] = useState<NewPage[]>([
    { pageNumber: 1, pageType: 'COVER' },
  ]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: schools } = useQuery({
    queryKey: ['school-units'],
    queryFn: getSchoolUnits,
  });

  const allUnits = schools?.flatMap((school) =>
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
    } else {
      setName('');
      setPages([{ pageNumber: 1, pageType: 'COVER' }]);
      setSelectedUnits([]);
    }
    setFormError(null);
  }, [template, open]);

  const resetForm = () => {
    setName('');
    setPages([{ pageNumber: 1, pageType: 'COVER' }]);
    setSelectedUnits([]);
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
    const next = pages.length > 0 ? pages[pages.length - 1].pageNumber + 1 : 1;
    setPages((prev) => [...prev, { pageNumber: next, pageType: 'TEXT' }]);
  };

  const removePage = (index: number) => {
    setPages((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, pageNumber: i + 1 })),
    );
  };

  const updatePageType = (index: number, pageType: string) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, pageType } : p)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    const payload = {
      name: name.trim(),
      pages: pages as BookTemplatePage[],
      units: selectedUnits,
    };

    if (template) {
      updateMutation.mutate({ id: template.id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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
                    {pages.map((page, idx) => (
                      <div
                        key={idx}
                        className='flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30'
                      >
                        <span className='w-7 text-center text-xs font-mono text-muted-foreground shrink-0'>
                          {page.pageNumber}
                        </span>
                        <select
                          value={page.pageType}
                          disabled={template?.hasBooks}
                          onChange={(e) => updatePageType(idx, e.target.value)}
                          className='flex-1 text-sm px-2 py-1.5 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-75 disabled:bg-muted/40'
                          aria-label={`Tipo da página ${page.pageNumber}`}
                        >
                          {BOOK_PAGE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {PAGE_TYPE_LABELS[type] ?? type}
                            </option>
                          ))}
                        </select>
                        {!template?.hasBooks && (
                          <button
                            type='button'
                            onClick={() => removePage(idx)}
                            disabled={pages.length <= 1}
                            className='p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
                            aria-label={`Remover página ${page.pageNumber}`}
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        )}
                      </div>
                    ))}
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
  const [editingTemplate, setEditingTemplate] = useState<BookTemplateResponse | null>(
    null,
  );

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

  const allUnits = schools?.flatMap((school) =>
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

