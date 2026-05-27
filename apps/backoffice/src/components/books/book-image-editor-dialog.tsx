import { useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Loader2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

async function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível preparar a imagem editada.');
  }

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Não foi possível recortar a imagem.');
  }

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('Não foi possível gerar o arquivo final.'));
    }, 'image/png');
  });
}

interface BookImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceUrl: string;
  pageNumber: number;
  onSave: (file: File) => Promise<unknown>;
}

export function BookImageEditorDialog({
  open,
  onOpenChange,
  sourceUrl,
  pageNumber,
  onSave,
}: BookImageEditorDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const effectiveSourceUrl = sourceUrl;

  useEffect(() => {
    if (!open) {
      return;
    }

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setError(null);
  }, [open, sourceUrl]);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!sourceUrl) {
      setError('A imagem original não está disponível para edição.');
      return;
    }

    if (!croppedAreaPixels) {
      setError('Aguarde a imagem carregar para salvar a edição.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const blob = await getCroppedImage(
        effectiveSourceUrl,
        croppedAreaPixels,
        rotation,
      );
      const file = new File([blob], `book-page-${pageNumber}.png`, {
        type: 'image/png',
      });

      await onSave(file);
      onOpenChange(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar a imagem editada.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-none w-[min(100vw,1920px)] overflow-hidden p-0'>
        <div className='flex flex-col'>
          <div className='flex w-full min-h-0 flex-1 flex-col border-border bg-neutral-950/95 text-white'>
            <DialogHeader className='px-6 py-5 text-left'>
              <DialogTitle className='text-xl text-white'>
                Editar imagem da página {pageNumber}
              </DialogTitle>
              <DialogDescription className='text-white/70'>
                Posicione o quadrado do desenho, ajuste o zoom ou a rotação e
                salve a imagem final.
              </DialogDescription>
            </DialogHeader>

            <div className='flex items-center justify-center px-2 pb-6'>
              <div className='relative h-[calc(100vh-38rem)] w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl'>
                {effectiveSourceUrl ? (
                  <Cropper
                    image={effectiveSourceUrl}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    cropShape='rect'
                    showGrid
                    restrictPosition
                    objectFit='contain'
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={(_, croppedPixels) =>
                      setCroppedAreaPixels(croppedPixels)
                    }
                    classes={{
                      containerClassName: 'rounded-3xl',
                      cropAreaClassName:
                        'border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]',
                    }}
                  />
                ) : (
                  <div className='flex h-full flex-col items-center justify-center gap-3 text-center text-white/70'>
                    <p className='text-sm font-medium'>Imagem indisponível</p>
                    <p className='max-w-sm text-xs'>
                      Não foi possível encontrar uma imagem para editar nesta
                      página.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='border-t border-border bg-background px-6 py-5'>
            <div className='flex flex-col gap-5'>
              <div className='space-y-4'>
                <div>
                  <div className='mb-2 flex items-center justify-between text-sm'>
                    <span className='font-medium'>Zoom</span>
                    <span className='text-muted-foreground'>
                      {zoom.toFixed(2)}x
                    </span>
                  </div>
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.01}
                    onValueChange={(values: number[]) =>
                      setZoom(values[0] ?? 1)
                    }
                  />
                </div>

                <div>
                  <div className='mb-2 flex items-center justify-between text-sm'>
                    <span className='font-medium'>Rotação</span>
                    <span className='text-muted-foreground'>{rotation}°</span>
                  </div>
                  <Slider
                    value={[rotation]}
                    min={-180}
                    max={180}
                    step={1}
                    onValueChange={(values: number[]) =>
                      setRotation(values[0] ?? 0)
                    }
                  />
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setRotation((value) => value - 90)}
                    disabled={isSaving || !effectiveSourceUrl}
                  >
                    <RotateCcw className='size-4' />
                    Girar -90°
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setRotation((value) => value + 90)}
                    disabled={isSaving || !effectiveSourceUrl}
                  >
                    <RotateCw className='size-4' />
                    Girar +90°
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleReset}
                    className='col-span-2'
                    disabled={isSaving || !effectiveSourceUrl}
                  >
                    <ZoomOut className='size-4' />
                    Restaurar
                  </Button>
                </div>
              </div>

              <div className='rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
                <p className='font-medium text-foreground'>Como salvar</p>
                <p className='mt-1'>
                  Use o quadrado central para enquadrar apenas o desenho. O
                  arquivo final será enviado em PNG.
                </p>
              </div>

              {error ? (
                <p className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600'>
                  {error}
                </p>
              ) : null}

              <DialogFooter className='pt-2'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  type='button'
                  onClick={handleSave}
                  disabled={isSaving || !effectiveSourceUrl}
                >
                  {isSaving ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <ZoomIn className='size-4' />
                  )}
                  Salvar imagem
                </Button>
              </DialogFooter>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
