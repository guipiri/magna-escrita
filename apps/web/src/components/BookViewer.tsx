import HTMLFlipBook from 'react-pageflip';

export interface BookViewerPage {
  imageUrl?: string | null;
  number?: number;
}

export interface BookViewerProps {
  pages?: BookViewerPage[];
}

export function BookViewer({ pages }: BookViewerProps) {
  if (!pages || pages.length === 0) return <p>Livro ainda em contrução...</p>;

  return (
    <div className='p-2 sm:p-8 flex justify-center items-center'>
      <HTMLFlipBook
        width={450}
        height={450}
        size='stretch'
        minWidth={280}
        maxWidth={550}
        minHeight={360}
        maxHeight={700}
        maxShadowOpacity={0.5}
        showCover={true}
        mobileScrollSupport={true}
        className=''
        ref={null}
        startPage={0}
        drawShadow={true}
        flippingTime={700}
        usePortrait={true}
        startZIndex={0}
        autoSize={true}
        clickEventForward={true}
        useMouseEvents={true}
        swipeDistance={0}
        showPageCorners={true}
        disableFlipByClick={false}
        style={{ margin: 'auto' }}
      >
        {pages.map((page) => (
          <div className='w-full h-full'>
            <img
              className='aspect-square w-full h-full object-cover'
              src={page.imageUrl || undefined}
              key={page.number}
            />
          </div>
        ))}
      </HTMLFlipBook>
    </div>
  );
}
