export interface BookPageData {
  id: string;
  magnificCode: string;
  title: string;
  author: string;
  synopsis: string | null;
  price: number;
  pages: Array<{
    number: number;
    type: string;
    textContent: string | null;
    drawImageUrl: string | null;
    imageUrl: string | null;
  }>;
}

export type CartBookData = Omit<BookPageData, 'pages'>;