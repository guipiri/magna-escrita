import { type TouchEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ViewerPage =
  | {
      type: 'image';
      src: string;
      alt: string;
      cover?: boolean;
    }
  | {
      type: 'blank';
      alt: string;
    };

interface ViewerSpread {
  id: string;
  label: string;
  pages: ViewerPage[];
}

interface MobileViewerPage {
  id: string;
  label: string;
  page: ViewerPage;
}

const storyPages = Array.from({ length: 14 }, (_, index) => ({
  type: 'image' as const,
  src: `/page${index + 2}.png`,
  alt: `Pagina ${index + 2}`,
}));

const spreads: ViewerSpread[] = [
  {
    id: 'cover',
    label: 'Capa',
    pages: [
      {
        type: 'image',
        src: '/cover.png',
        alt: 'Capa do livro',
        cover: true,
      },
    ],
  },
  {
    id: 'summary',
    label: 'Resumo',
    pages: [
      {
        type: 'blank',
        alt: 'Pagina em branco',
      },
      {
        type: 'image',
        src: '/summary.jpg',
        alt: 'Resumo do livro',
      },
    ],
  },
  ...Array.from({ length: Math.ceil(storyPages.length / 2) }, (_, index) => {
    const firstPage = storyPages[index * 2];
    const secondPage = storyPages[index * 2 + 1];

    return {
      id: `pages-${index}`,
      label: `${index * 2 + 2}-${index * 2 + 3}`,
      pages: secondPage ? [firstPage, secondPage] : [firstPage],
    };
  }),
  {
    id: 'thanks',
    label: 'Agradecimentos',
    pages: [
      {
        type: 'image',
        src: '/thanks.jpg',
        alt: 'Agradecimentos',
      },
      {
        type: 'blank',
        alt: 'Pagina em branco',
      },
    ],
  },
  {
    id: 'back-cover',
    label: 'Contra capa',
    pages: [
      {
        type: 'image',
        src: '/back_cover.png',
        alt: 'Contra capa do livro',
        cover: true,
      },
    ],
  },
];

const mobilePages: MobileViewerPage[] = spreads.flatMap((spread) =>
  spread.pages.map((page, index) => ({
    id: `${spread.id}-${index}`,
    label:
      spread.pages.length === 1 ? spread.label : `${spread.label} ${index + 1}`,
    page,
  })),
);

export function BookViewer() {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [currentMobilePage, setCurrentMobilePage] = useState(0);
  const [direction, setDirection] = useState(0);
  const indicatorRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileIndicatorRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const current = spreads[currentSpread];
  const currentMobile = mobilePages[currentMobilePage];
  const isFirstSpread = currentSpread === 0;
  const isLastSpread = currentSpread === spreads.length - 1;
  const isFirstMobilePage = currentMobilePage === 0;
  const isLastMobilePage = currentMobilePage === mobilePages.length - 1;

  const goToSpread = (nextSpread: number) => {
    if (nextSpread < 0 || nextSpread >= spreads.length) return;

    setDirection(nextSpread > currentSpread ? 1 : -1);
    setCurrentSpread(nextSpread);
  };

  const nextSpread = () => goToSpread(currentSpread + 1);
  const previousSpread = () => goToSpread(currentSpread - 1);

  const goToMobilePage = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= mobilePages.length) return;

    setDirection(nextPage > currentMobilePage ? 1 : -1);
    setCurrentMobilePage(nextPage);
  };

  const nextMobilePage = () => goToMobilePage(currentMobilePage + 1);
  const previousMobilePage = () => goToMobilePage(currentMobilePage - 1);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];

    touchStartRef.current = null;

    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const isHorizontalSwipe =
      Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

    if (!isHorizontalSwipe) return;

    if (deltaX < 0) {
      nextMobilePage();
    } else {
      previousMobilePage();
    }
  };

  useEffect(() => {
    indicatorRefs.current[currentSpread]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [currentSpread]);

  useEffect(() => {
    mobileIndicatorRefs.current[currentMobilePage]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [currentMobilePage]);

  return (
    <div className='w-full max-w-6xl mx-auto px-4'>
      <div className='hidden md:block'>
        <AnimatePresence initial={false} custom={direction} mode='wait'>
          <motion.div
            key={current.id}
            custom={direction}
            variants={spreadVariants}
            initial='enter'
            animate='center'
            exit='exit'
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <SpreadView spread={current} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className='md:hidden touch-pan-y select-none'
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode='wait'>
          <motion.div
            key={currentMobile.id}
            custom={direction}
            variants={spreadVariants}
            initial='enter'
            animate='center'
            exit='exit'
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <SinglePageView page={currentMobile.page} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className='hidden md:flex justify-between mt-2 px-4'>
        <button
          onClick={previousSpread}
          disabled={isFirstSpread}
          className='rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95'
          aria-label='Pagina anterior'
        >
          <ChevronLeft className='w-6 h-6 text-purple-600' />
        </button>

        <button
          onClick={nextSpread}
          disabled={isLastSpread}
          className='rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95'
          aria-label='Proxima pagina'
        >
          <ChevronRight className='w-6 h-6 text-purple-600' />
        </button>
      </div>

      <div className='md:hidden flex justify-between mt-2 px-4'>
        <button
          onClick={previousMobilePage}
          disabled={isFirstMobilePage}
          className='rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95'
          aria-label='Pagina anterior'
        >
          <ChevronLeft className='w-6 h-6 text-purple-600' />
        </button>

        <button
          onClick={nextMobilePage}
          disabled={isLastMobilePage}
          className='rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95'
          aria-label='Proxima pagina'
        >
          <ChevronRight className='w-6 h-6 text-purple-600' />
        </button>
      </div>

      <div className='hidden md:flex max-w-full justify-center gap-2 overflow-x-auto overflow-y-hidden px-4 pb-2 [-webkit-overflow-scrolling:touch]'>
        {spreads.map((spread, index) => (
          <button
            key={spread.id}
            ref={(element) => {
              indicatorRefs.current[index] = element;
            }}
            onClick={() => goToSpread(index)}
            className={`h-10 min-w-10 flex-none rounded-full px-3 text-sm transition-all ${
              index === currentSpread
                ? 'bg-purple-600 text-white'
                : 'bg-purple-200 hover:bg-purple-300 text-purple-700'
            }`}
            aria-label={`Ir para ${spread.label}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className='md:hidden flex max-w-full justify-start gap-2 overflow-x-auto overflow-y-hidden px-4 pb-2 [-webkit-overflow-scrolling:touch]'>
        {mobilePages.map((page, index) => (
          <button
            key={page.id}
            ref={(element) => {
              mobileIndicatorRefs.current[index] = element;
            }}
            onClick={() => goToMobilePage(index)}
            className={`h-10 min-w-10 flex-none rounded-full px-3 text-sm transition-all ${
              index === currentMobilePage
                ? 'bg-purple-600 text-white'
                : 'bg-purple-200 hover:bg-purple-300 text-purple-700'
            }`}
            aria-label={`Ir para ${page.label}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

const spreadVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -120 : 120,
    opacity: 0,
  }),
};

function SpreadView({ spread }: { spread: ViewerSpread }) {
  const isSinglePage = spread.pages.length === 1;

  return (
    <div
      className={`mx-auto flex items-center justify-center ${
        isSinglePage ? 'max-w-md' : 'max-w-5xl gap-1'
      }`}
    >
      {spread.pages.map((page, index) => (
        <BookPageSheet
          key={`${spread.id}-${index}`}
          page={page}
          position={getPagePosition(index, spread.pages.length)}
        />
      ))}
    </div>
  );
}

function SinglePageView({ page }: { page: ViewerPage }) {
  return (
    <div className='mx-auto flex max-w-md items-center justify-center'>
      <BookPageSheet page={page} position='single' />
    </div>
  );
}

function BookPageSheet({
  page,
  position,
}: {
  page: ViewerPage;
  position: 'single' | 'left' | 'right';
}) {
  const roundedClass =
    position === 'single'
      ? 'rounded-2xl'
      : position === 'left'
        ? 'rounded-l-2xl'
        : 'rounded-r-2xl';

  const shadowClass =
    position === 'single'
      ? 'shadow-2xl'
      : position === 'left'
        ? 'shadow-[-10px_10px_30px_rgba(0,0,0,0.25)]'
        : 'shadow-[10px_10px_30px_rgba(0,0,0,0.25)]';

  const aspectClass =
    page.type === 'image' && page.cover
      ? 'aspect-[1373/1413]'
      : 'aspect-square';

  if (page.type === 'blank') {
    return (
      <div
        className={`${roundedClass} ${shadowClass} ${aspectClass} flex-1 relative overflow-hidden bg-white`}
        aria-label={page.alt}
      ></div>
    );
  }

  return (
    <div
      className={`${roundedClass} ${shadowClass} ${aspectClass} flex-1 relative overflow-hidden bg-white`}
    >
      <img
        src={page.src}
        alt={page.alt}
        className='h-full w-full object-contain'
        draggable={false}
      />
    </div>
  );
}

function getPagePosition(
  index: number,
  totalPages: number,
): 'single' | 'left' | 'right' {
  if (totalPages === 1) return 'single';

  return index === 0 ? 'left' : 'right';
}
