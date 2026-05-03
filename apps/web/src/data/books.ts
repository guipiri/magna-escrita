export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
}

export const BOOKS: Book[] = [
  {
    id: 'book-001',
    title: 'A Cidade das Palavras',
    author: 'Lia Monteiro',
    description:
      'Um romance sobre memória, linguagem e os encontros improváveis que mudam uma vida.',
    price: 39.9,
  },
  {
    id: 'book-002',
    title: 'Código em Movimento',
    author: 'Rafael Cordeiro',
    description:
      'Ensaios curtos sobre produto, software e a disciplina de construir coisas que duram.',
    price: 52.5,
  },
  {
    id: 'book-003',
    title: 'Mar de Tinta',
    author: 'Helena Vieira',
    description:
      'Crônicas poéticas para leitura lenta, com capítulos que alternam mar, rua e silêncio.',
    price: 47,
  },
  {
    id: 'book-004',
    title: 'Atlas de Pequenas Revoluções',
    author: 'Nuno Azevedo',
    description:
      'Uma coleção de histórias sobre mudanças discretas que alteram o curso de uma cidade.',
    price: 58.8,
  },
];

export const findBookById = (bookId: string) =>
  BOOKS.find((book) => book.id === bookId);
