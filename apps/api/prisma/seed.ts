import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PageType, PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const mockBookPages = [
  { number: 0, type: PageType.COVER, imageUrl: '/cover.png' },
  { number: 1, type: PageType.BLANK, imageUrl: null },
  { number: 2, type: PageType.PREFACE, imageUrl: '/summary.jpg' },
  ...Array.from({ length: 14 }, (_, index) => ({
    number: index + 3,
    type: PageType.DRAW,
    imageUrl: `/page${index + 2}.png`,
  })),
  { number: 17, type: PageType.THANKS, imageUrl: '/thanks.jpg' },
  { number: 18, type: PageType.BLANK, imageUrl: null },
  { number: 19, type: PageType.BACK_COVER, imageUrl: '/back_cover.png' },
];

async function main() {
  console.log('🌱 Iniciando seed de livros...');

  // Criar/atualizar preços
  const prices = await Promise.all([
    prisma.price.upsert({
      where: { id: 'price-001' },
      update: {},
      create: {
        id: 'price-001',
        amount: 39.9,
      },
    }),
    prisma.price.upsert({
      where: { id: 'price-002' },
      update: {},
      create: {
        id: 'price-002',
        amount: 52.5,
      },
    }),
    prisma.price.upsert({
      where: { id: 'price-003' },
      update: {},
      create: {
        id: 'price-003',
        amount: 47.0,
      },
    }),
    prisma.price.upsert({
      where: { id: 'price-004' },
      update: {},
      create: {
        id: 'price-004',
        amount: 58.8,
      },
    }),
    prisma.price.upsert({
      where: { id: 'price-mock-davina' },
      update: {
        amount: 39.9,
      },
      create: {
        id: 'price-mock-davina',
        amount: 39.9,
      },
    }),
  ]);

  console.log(`✅ ${prices.length} preços criados/atualizados`);

  // Criar/atualizar livros
  const books = await Promise.all([
    prisma.book.upsert({
      where: { id: 'book-001' },
      update: {},
      create: {
        id: 'book-001',
        title: 'A Cidade das Palavras',
        author: 'Lia Monteiro',
        synopsis:
          'Um romance sobre memória, linguagem e os encontros improváveis que mudam uma vida.',
        priceId: 'price-001',
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-002' },
      update: {},
      create: {
        id: 'book-002',
        title: 'Código em Movimento',
        author: 'Rafael Cordeiro',
        synopsis:
          'Ensaios curtos sobre produto, software e a disciplina de construir coisas que duram.',
        priceId: 'price-002',
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-003' },
      update: {},
      create: {
        id: 'book-003',
        title: 'Mar de Tinta',
        author: 'Helena Vieira',
        synopsis:
          'Crônicas poéticas para leitura lenta, com capítulos que alternam mar, rua e silêncio.',
        priceId: 'price-003',
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-004' },
      update: {},
      create: {
        id: 'book-004',
        title: 'Atlas de Pequenas Revoluções',
        author: 'Nuno Azevedo',
        synopsis:
          'Uma coleção de histórias sobre mudanças discretas que alteram o curso de uma cidade.',
        priceId: 'price-004',
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-mock-davina' },
      update: {
        title: 'Livro Mock Davina',
        author: 'Davina',
        synopsis:
          'Livro de demonstração criado a partir das imagens mock em public.',
        priceId: 'price-mock-davina',
      },
      create: {
        id: 'book-mock-davina',
        title: 'Livro Mock Davina',
        author: 'Davina',
        synopsis:
          'Livro de demonstração criado a partir das imagens mock em public.',
        priceId: 'price-mock-davina',
      },
    }),
  ]);

  console.log(`✅ ${books.length} livros criados/atualizados`);

  await Promise.all(
    mockBookPages.map((page) =>
      prisma.page.upsert({
        where: { number: page.number },
        update: {
          type: page.type,
          imageUrl: page.imageUrl,
          bookId: 'book-mock-davina',
        },
        create: {
          number: page.number,
          type: page.type,
          imageUrl: page.imageUrl,
          bookId: 'book-mock-davina',
        },
      }),
    ),
  );

  console.log(`✅ ${mockBookPages.length} páginas mock criadas/atualizadas`);
  console.log('📚 Livros no banco:');
  books.forEach((book) => {
    console.log(`  - ${book.title} (${book.author}) - R$ ${book.id}`);
  });
}

main()
  .then(async () => {
    console.log('✨ Seed concluído com sucesso!');
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Erro durante seed:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
