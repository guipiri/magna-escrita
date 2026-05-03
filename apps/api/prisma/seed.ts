import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
        description:
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
        description:
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
        description:
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
        description:
          'Uma coleção de histórias sobre mudanças discretas que alteram o curso de uma cidade.',
        priceId: 'price-004',
      },
    }),
  ]);

  console.log(`✅ ${books.length} livros criados/atualizados`);
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
