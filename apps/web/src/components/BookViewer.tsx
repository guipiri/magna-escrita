import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

interface BookPage {
  id: number;
  content: string;
  image?: string;
}

interface BookViewerProps {
  pages: BookPage[];
}

export function BookViewer({ pages }: BookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Desktop: navega de 2 em 2 páginas
  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setDirection(1);
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(currentPage - 1);
    }
  };

  // Mobile: navega página por página alternando texto e imagem
  const nextMobilePage = () => {
    setDirection(1);
    setCurrentMobileIndex(currentMobileIndex + 1);
  };

  const prevMobilePage = () => {
    if (currentMobileIndex > 0) {
      setDirection(-1);
      setCurrentMobileIndex(currentMobileIndex - 1);
    }
  };

  // Calcula qual página está sendo exibida no mobile
  const getMobilePageInfo = () => {
    const pageIndex = Math.floor(currentMobileIndex / 2);
    const isImage = currentMobileIndex % 2 === 1;
    return { page: pages[pageIndex], isImage, pageIndex };
  };

  const leftPage = pages[currentPage];
  const rightPage = pages[currentPage + 1];

  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      rotateY: direction > 0 ? -90 : 90,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
      rotateY: direction > 0 ? 90 : -90,
    }),
  };

  const mobilePageInfo = getMobilePageInfo();
  const totalMobilePages = pages.length * 2;

  return (
    <div className='w-full max-w-6xl mx-auto px-4'>
      <div className='relative'>
        {/* Desktop: 2 páginas lado a lado */}
        <div className='hidden md:flex gap-1 perspective-[2000px]'>
          <AnimatePresence initial={false} custom={direction} mode='wait'>
            <motion.div
              key={`left-${currentPage}`}
              custom={direction}
              variants={pageVariants}
              initial='enter'
              animate='center'
              exit='exit'
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className='flex-1'
            >
              <Page page={leftPage} position='left' />
            </motion.div>
          </AnimatePresence>

          <div className='w-1 from-gray-300 via-gray-400 to-gray-300 shadow-lg' />

          <AnimatePresence initial={false} custom={direction} mode='wait'>
            <motion.div
              key={`right-${currentPage + 1}`}
              custom={direction}
              variants={pageVariants}
              initial='enter'
              animate='center'
              exit='exit'
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className='flex-1'
            >
              <Page page={rightPage} position='right' />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile: 1 página por vez (quadrada) */}
        <div className='md:hidden'>
          <AnimatePresence initial={false} custom={direction} mode='wait'>
            <motion.div
              key={currentMobileIndex}
              custom={direction}
              variants={pageVariants}
              initial='enter'
              animate='center'
              exit='exit'
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <MobilePage
                page={mobilePageInfo.page}
                isImage={mobilePageInfo.isImage}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Botões de navegação */}
      </div>

      <div className='flex justify-between mt-4 px-4'>
        <button
          onClick={() => {
            if (window.innerWidth >= 768) {
              prevPage();
            } else {
              prevMobilePage();
            }
          }}
          disabled={
            window.innerWidth >= 768
              ? currentPage === 0
              : currentMobileIndex === 0
          }
          className='rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95'
          aria-label='Página anterior'
        >
          <ChevronLeft className='w-6 h-6 text-purple-600' />
        </button>

        <button
          onClick={() => {
            if (window.innerWidth >= 768) {
              nextPage();
            } else {
              nextMobilePage();
            }
          }}
          disabled={
            window.innerWidth >= 768
              ? currentPage >= pages.length - 2
              : currentMobileIndex >= totalMobilePages - 1
          }
          className='rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95'
          aria-label='Próxima página'
        >
          <ChevronRight className='w-6 h-6 text-purple-600' />
        </button>
      </div>

      {/* Indicadores de página */}
      <div className='hidden md:flex justify-center gap-2 mt-8'>
        {Array.from({ length: Math.ceil(pages.length) }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentPage ? 1 : -1);
              setCurrentPage(i);
            }}
            className={`rounded-full outline-0 transition-all ${
              i === currentPage
                ? 'bg-purple-600 w-8'
                : 'bg-purple-200 hover:bg-purple-300'
            }`}
            aria-label={`Ir para página ${i * 2 + 1}`}
          />
        ))}
      </div>

      {/* Indicadores de página mobile */}
      <div className='md:hidden flex justify-center gap-2 mt-8'>
        {Array.from({ length: totalMobilePages }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentMobileIndex ? 1 : -1);
              setCurrentMobileIndex(i);
            }}
            className={`rounded-full transition-all ${
              i === currentMobileIndex
                ? 'bg-purple-600 w-8'
                : 'bg-purple-200 hover:bg-purple-300'
            }`}
            aria-label={`Ir para página ${i + 1}`}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}

interface PageProps {
  page: BookPage | undefined;
  position: 'left' | 'right';
}

interface MobilePageProps {
  page: BookPage | undefined;
  isImage: boolean;
}

function MobilePage({ page, isImage }: MobilePageProps) {
  if (!page) return null;

  const bgClass =
    isImage && page.image
      ? 'bg-gray-100'
      : 'bg-gradient-to-br from-amber-50 to-orange-50';

  return (
    <div
      className={`rounded-2xl shadow-2xl h-96 w-full relative overflow-hidden ${bgClass} p-6 flex flex-col justify-center aspect-square h-auto`}
    >
      <div className='absolute inset-0 opacity-5 pointer-events-none'>
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </div>
      <div className='relative z-10 w-full h-full flex items-center justify-center'>
        {isImage ? (
          // Página com imagem
          <>
            {page.image ? (
              <ImageWithFallback
                src={page.image}
                alt={`Ilustração da página ${page.id}`}
                className='w-full h-full object-cover rounded-lg shadow-md'
              />
            ) : (
              <div className='w-full h-full bg-purple-100 rounded-lg flex items-center justify-center'>
                <span className='text-gray-400 text-center px-4'>
                  Página {page.id}
                </span>
              </div>
            )}
          </>
        ) : (
          // Página com texto
          <div className='prose prose-sm max-w-none text-center'>
            <p className='text-gray-800 leading-relaxed whitespace-pre-wrap text-sm'>
              {page.content}
            </p>
          </div>
        )}
      </div>
      <div className='absolute bottom-3 right-4 text-gray-400 select-none text-xs'>
        {page.id}
      </div>
    </div>
  );
}

function Page({ page, position }: PageProps) {
  if (!page) return null;

  const roundedClass =
    position === 'left'
      ? 'rounded-l-2xl'
      : position === 'right'
        ? 'rounded-r-2xl'
        : 'rounded-2xl';

  const shadowClass =
    position === 'left'
      ? 'shadow-[-10px_10px_30px_rgba(0,0,0,0.3)]'
      : position === 'right'
        ? 'shadow-[10px_10px_30px_rgba(0,0,0,0.3)]'
        : 'shadow-2xl';

  // Desktop: página esquerda mostra apenas texto
  if (position === 'left') {
    return (
      <div
        className={`${roundedClass} ${shadowClass} h-auto aspect-square relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 p-6 md:p-8 flex flex-col justify-center`}
      >
        <div className='absolute inset-0 opacity-5 pointer-events-none'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
        </div>

        <div className='relative z-10 prose prose-sm md:prose-base max-w-none'>
          <p className='text-gray-800 leading-relaxed whitespace-pre-wrap text-sm md:text-base'>
            {page.content}
          </p>
        </div>

        <div className='absolute bottom-3 right-4 text-gray-400 select-none text-xs md:text-sm'>
          {page.id}
        </div>
      </div>
    );
  }

  // Desktop: página direita mostra apenas imagem
  if (position === 'right') {
    return (
      <div
        className={`${roundedClass} ${shadowClass} h-auto aspect-square relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 p-6 md:p-8 flex items-center justify-center`}
      >
        <div className='absolute inset-0 opacity-5 pointer-events-none'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
        </div>

        <div className='relative z-10 w-full h-full'>
          {page.image ? (
            <ImageWithFallback
              src={page.image}
              alt={`Ilustração da página ${page.id}`}
              className='w-full h-full object-cover rounded-lg shadow-md'
            />
          ) : (
            <div className='w-full h-full bg-purple-100 rounded-lg flex items-center justify-center'>
              <span className='text-gray-400 text-center px-4'>
                Página {page.id}
              </span>
            </div>
          )}
        </div>

        <div className='absolute bottom-3 right-4 text-gray-400 select-none text-xs md:text-sm'>
          {page.id}
        </div>
      </div>
    );
  }

  return null;
}
