import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { scanBooks } from '../../services/books-service';
import type { ScanBooksResult } from '@repo/shared';

interface BulkUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileEntry {
  id: string;
  file: File;
  previewUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BulkUploadDialog({ isOpen, onClose }: BulkUploadDialogProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (filesToUpload: File[]) => scanBooks(filesToUpload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const result: ScanBooksResult | undefined = mutation.data;
  const isUploading = mutation.isPending;
  const isDone = mutation.isSuccess || mutation.isError;

  /* ── File management ── */

  const addFiles = useCallback((incoming: File[]) => {
    const imageFiles = incoming.filter((f) => f.type.startsWith('image/'));
    const entries: FileEntry[] = imageFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const entry = prev.find((f) => f.id === id);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return [];
    });
  }, []);

  /* ── Drag handlers ── */

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(Array.from(e.target.files));
        e.target.value = '';
      }
    },
    [addFiles],
  );

  /* ── Dialog actions ── */

  const handleClose = useCallback(() => {
    if (isUploading) return;
    clearAll();
    mutation.reset();
    onClose();
  }, [isUploading, clearAll, mutation, onClose]);

  const handleUpload = useCallback(() => {
    mutation.mutate(files.map((e) => e.file));
  }, [mutation, files]);

  const handleReset = useCallback(() => {
    clearAll();
    mutation.reset();
  }, [clearAll, mutation]);

  /* ── Render helpers ── */

  const renderResultRow = (filename: string) => {
    const pageResult = result?.results.find((r) => r.filename === filename);
    if (!pageResult) return null;
    if (pageResult.status === 'enqueued') {
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
          <Loader2 className="size-3.5 shrink-0 animate-spin" />
          Fila de processamento...
        </span>
      );
    }
    const isOk = pageResult.status === 'success';
    return (
      <span
        className={cn(
          'flex items-center gap-1 text-xs font-medium',
          isOk ? 'text-emerald-600' : 'text-destructive',
        )}
      >
        {isOk ? (
          <CheckCircle2 className='size-3.5 shrink-0' />
        ) : (
          <AlertCircle className='size-3.5 shrink-0' />
        )}
        {isOk ? `Pág. ${pageResult.pageNumber}` : (pageResult.error ?? 'Erro')}
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Upload em massa</DialogTitle>
          <DialogDescription>
            Arraste e solte imagens de páginas digitalizadas ou clique para
            selecionar. Apenas arquivos de imagem são aceitos.
          </DialogDescription>
        </DialogHeader>

        {/* ── Drop zone (hidden after upload) ── */}
        {!isDone && (
          <div
            role='button'
            tabIndex={0}
            aria-label='Área de upload de arquivos'
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && inputRef.current?.click()}
            onKeyDown={(e) =>
              !isUploading && e.key === 'Enter' && inputRef.current?.click()
            }
            className={cn(
              'relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-200',
              isUploading && 'pointer-events-none opacity-60',
              isDragging
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50',
            )}
          >
            <div
              className={cn(
                'flex size-12 items-center justify-center rounded-xl transition-colors duration-200',
                isDragging
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {isUploading ? (
                <Loader2 className='size-6 animate-spin' />
              ) : (
                <UploadCloud className='size-6' />
              )}
            </div>
            <div>
              <p className='text-sm font-medium text-foreground'>
                {isUploading
                  ? 'Enviando imagens...'
                  : isDragging
                    ? 'Solte os arquivos aqui'
                    : 'Arraste imagens ou clique para selecionar'}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                PNG, JPG, WEBP — sem limite de quantidade
              </p>
            </div>
            <input
              ref={inputRef}
              type='file'
              accept='image/*'
              multiple
              className='sr-only'
              onChange={handleInputChange}
              aria-hidden='true'
            />
          </div>
        )}

        {/* ── Summary banner (after upload) ── */}
        {isDone && result && (
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4',
              result.failed === 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700',
            )}
          >
            {result.failed === 0 ? (
              <CheckCircle2 className='size-5 shrink-0' />
            ) : (
              <AlertCircle className='size-5 shrink-0' />
            )}
            <div>
              <p className='text-sm font-semibold'>
                {result.succeeded} de {result.processed} processados com sucesso
              </p>
              {result.failed > 0 && (
                <p className='mt-0.5 text-xs'>
                  {result.failed} {result.failed === 1 ? 'falhou' : 'falharam'}{' '}
                  — veja os detalhes abaixo.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── File list ── */}
        {files.length > 0 && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-medium text-muted-foreground'>
                {files.length}{' '}
                {files.length === 1
                  ? 'arquivo selecionado'
                  : 'arquivos selecionados'}
              </p>
              {!isDone && !isUploading && (
                <button
                  type='button'
                  onClick={clearAll}
                  className='flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
                >
                  <X className='size-3' />
                  Remover todos
                </button>
              )}
            </div>

            <ul className='max-h-52 space-y-1.5 overflow-y-auto pr-1'>
              {files.map((entry) => (
                <li
                  key={entry.id}
                  className='flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-2'
                >
                  <div className='shrink-0'>
                    <img
                      src={entry.previewUrl}
                      alt={entry.file.name}
                      className='size-8 rounded object-cover'
                    />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p
                      className='truncate text-xs font-medium text-foreground'
                      title={entry.file.name}
                    >
                      {entry.file.name}
                    </p>
                    {isDone ? (
                      renderResultRow(entry.file.name)
                    ) : (
                      <p className='text-xs text-muted-foreground'>
                        {formatBytes(entry.file.size)}
                      </p>
                    )}
                  </div>
                  {!isDone && !isUploading && (
                    <button
                      type='button'
                      aria-label={`Remover ${entry.file.name}`}
                      onClick={() => removeFile(entry.id)}
                      className='shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
                    >
                      <Trash2 className='size-3.5' />
                    </button>
                  )}
                  {isUploading && (
                    <Loader2 className='size-3.5 shrink-0 animate-spin text-muted-foreground' />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {files.length === 0 && !isDone && (
          <div className='flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5'>
            <FileImage className='size-4 shrink-0 text-muted-foreground' />
            <p className='text-xs text-muted-foreground'>
              Nenhum arquivo selecionado ainda.
            </p>
          </div>
        )}

        <DialogFooter>
          {isDone ? (
            <>
              <Button variant='outline' onClick={handleReset}>
                Novo upload
              </Button>
              <Button onClick={handleClose}>Fechar</Button>
            </>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className='size-4 animate-spin' />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UploadCloud className='size-4' />
                    Enviar {files.length > 0 ? `(${files.length})` : ''}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
