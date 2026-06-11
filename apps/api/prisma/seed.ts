import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { AuthographsEventStatus, PageType, PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const MOCK_SOFIA_MAGNIFIC_CODE = 'SOFIA-MAGICA-001';
const DEFAULT_CLASS_BOOK_TEMPLATE_ID = 'book-template-default';

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

function generateMagnificCode(): string {
  const baseString = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += baseString.charAt(Math.floor(Math.random() * baseString.length));
  }
  return result;
}

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
      where: { id: 'price-mock-sofia' },
      update: {
        amount: 39.9,
      },
      create: {
        id: 'price-mock-sofia',
        amount: 39.9,
      },
    }),
  ]);

  console.log(`✅ ${prices.length} preços criados/atualizados`);

  console.log('📑 Criando modelo padrão de turma...');
  const defaultClassBookTemplate = await prisma.bookTemplate.upsert({
    where: { id: DEFAULT_CLASS_BOOK_TEMPLATE_ID },
    update: {
      name: 'Modelo padrão de turma',
    },
    create: {
      id: DEFAULT_CLASS_BOOK_TEMPLATE_ID,
      name: 'Modelo padrão de turma',
    },
  });

  await Promise.all([
    prisma.bookTemplatePage.upsert({
      where: {
        bookTemplateId_pageNumber: {
          bookTemplateId: defaultClassBookTemplate.id,
          pageNumber: 0,
        },
      },
      update: {
        pageType: PageType.COVER,
      },
      create: {
        bookTemplateId: defaultClassBookTemplate.id,
        pageNumber: 0,
        pageType: PageType.COVER,
      },
    }),
    prisma.bookTemplatePage.upsert({
      where: {
        bookTemplateId_pageNumber: {
          bookTemplateId: defaultClassBookTemplate.id,
          pageNumber: 1,
        },
      },
      update: {
        pageType: PageType.TEXT,
      },
      create: {
        bookTemplateId: defaultClassBookTemplate.id,
        pageNumber: 1,
        pageType: PageType.TEXT,
      },
    }),
    prisma.bookTemplatePage.upsert({
      where: {
        bookTemplateId_pageNumber: {
          bookTemplateId: defaultClassBookTemplate.id,
          pageNumber: 2,
        },
      },
      update: {
        pageType: PageType.BACK_COVER,
      },
      create: {
        bookTemplateId: defaultClassBookTemplate.id,
        pageNumber: 2,
        pageType: PageType.BACK_COVER,
      },
    }),
  ]);

  console.log('✅ Modelo padrão de turma criado/atualizado');

  // livros will be created after classes and students are available

  // Criar/atualizar escolas
  console.log('\n🏫 Iniciando seed de escolas...');
  const schools = await Promise.all([
    prisma.school.upsert({
      where: { id: 'school-001' },
      update: {},
      create: {
        id: 'school-001',
        name: 'Escola Municipal de São Paulo',
      },
    }),
    prisma.school.upsert({
      where: { id: 'school-002' },
      update: {},
      create: {
        id: 'school-002',
        name: 'Colégio Estadual Rio de Janeiro',
      },
    }),
    prisma.school.upsert({
      where: { id: 'school-003' },
      update: {},
      create: {
        id: 'school-003',
        name: 'Instituto de Educação Belo Horizonte',
      },
    }),
  ]);

  console.log(`✅ ${schools.length} escolas criadas/atualizadas`);

  // Criar/atualizar unidades
  console.log('🏢 Criando unidades...');
  const units = await Promise.all([
    prisma.unit.upsert({
      where: { id: 'unit-001' },
      update: {},
      create: {
        id: 'unit-001',
        name: 'Unidade Centro',
        schoolId: 'school-001',
      },
    }),
    prisma.unit.upsert({
      where: { id: 'unit-002' },
      update: {},
      create: {
        id: 'unit-002',
        name: 'Unidade Zona Oeste',
        schoolId: 'school-001',
      },
    }),
    prisma.unit.upsert({
      where: { id: 'unit-003' },
      update: {},
      create: {
        id: 'unit-003',
        name: 'Unidade Centro',
        schoolId: 'school-002',
      },
    }),
    prisma.unit.upsert({
      where: { id: 'unit-004' },
      update: {},
      create: {
        id: 'unit-004',
        name: 'Unidade Saúde',
        schoolId: 'school-003',
      },
    }),
  ]);

  console.log(`✅ ${units.length} unidades criadas/atualizadas`);

  // Criar classe e aluno necessários para os livros
  const klass = await prisma.class.upsert({
    where: { id: 'class-001' },
    update: {},
    create: {
      id: 'class-001',
      name: 'Turma A',
      teacherName: 'Prof. Exemplo',
      unitId: 'unit-001',
      bookTemplateId: DEFAULT_CLASS_BOOK_TEMPLATE_ID,
      schoolYear: 'YEAR_2026',
    },
  });

  const student = await prisma.student.upsert({
    where: { id: 'student-001' },
    update: { name: 'Sofia Maria', age: 7, classId: klass.id },
    create: {
      id: 'student-001',
      name: 'Sofia Maria',
      age: 7,
      classId: klass.id,
    },
  });

  // Criar/atualizar livros (agora que student/class/unit existem)
  const books = await Promise.all([
    prisma.book.upsert({
      where: { id: 'book-001' },
      update: {
        id: 'book-001',
        title: 'A Cidade das Palavras',
        studentId: student.id,
        magnificCode: generateMagnificCode(),
        author: 'Lia Monteiro',
        synopsis:
          'Um romance sobre memória, linguagem e os encontros improváveis que mudam uma vida.',
        priceId: 'price-001',
      },
      create: {
        id: 'book-001',
        title: 'A Cidade das Palavras',
        studentId: student.id,
        magnificCode: generateMagnificCode(),
        author: 'Lia Monteiro',
        synopsis:
          'Um romance sobre memória, linguagem e os encontros improváveis que mudam uma vida.',
        priceId: 'price-001',
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-002' },
      update: {
        id: 'book-002',
        title: 'Código em Movimento',
        studentId: student.id,
        magnificCode: generateMagnificCode(),
        author: 'Rafael Cordeiro',
        synopsis:
          'Ensaios curtos sobre produto, software e a disciplina de construir coisas que duram.',
        priceId: 'price-002',
      },
      create: {
        id: 'book-002',
        title: 'Código em Movimento',
        studentId: student.id,
        magnificCode: generateMagnificCode(),
        author: 'Rafael Cordeiro',
        synopsis:
          'Ensaios curtos sobre produto, software e a disciplina de construir coisas que duram.',
        priceId: 'price-002',
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-003' },
      update: {
        id: 'book-003',
        title: 'Mar de Tinta',
        studentId: student.id,
        magnificCode: generateMagnificCode(),
        author: 'Helena Vieira',
        synopsis:
          'Crônicas poéticas para leitura lenta, com capítulos que alternam mar, rua e silêncio.',
        priceId: 'price-003',
      },
      create: {
        id: 'book-003',
        title: 'Mar de Tinta',
        studentId: student.id,
        magnificCode: generateMagnificCode(),
        author: 'Helena Vieira',
        synopsis:
          'Crônicas poéticas para leitura lenta, com capítulos que alternam mar, rua e silêncio.',
        priceId: 'price-003',
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-004' },
      update: {
        id: 'book-004',
        title: 'Atlas de Pequenas Revoluções',
        studentId: student.id,
        magnificCode: generateMagnificCode(),
        author: 'Nuno Azevedo',
        synopsis:
          'Uma coleção de histórias sobre mudanças discretas que alteram o curso de uma cidade.',
        priceId: 'price-004',
      },
      create: {
        id: 'book-004',
        title: 'Atlas de Pequenas Revoluções',
        studentId: student.id,
        magnificCode: generateMagnificCode(),
        author: 'Nuno Azevedo',
        synopsis:
          'Uma coleção de histórias sobre mudanças discretas que alteram o curso de uma cidade.',
        priceId: 'price-004',
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-mock-sofia' },
      update: {
        title: 'As Aventuras Mágicas de Sofia',
        magnificCode: MOCK_SOFIA_MAGNIFIC_CODE,
        studentId: student.id,
        author: 'Sofia Maria, 7 anos',
        synopsis:
          'Uma história encantadora sobre uma menina que descobre um mundo mágico cheio de cores, amizade e aventuras incríveis. Escrito e ilustrado com todo o carinho por uma jovem autora.',
        priceId: 'price-mock-sofia',
      },
      create: {
        id: 'book-mock-sofia',
        title: 'As Aventuras Mágicas de Sofia',
        magnificCode: MOCK_SOFIA_MAGNIFIC_CODE,
        studentId: student.id,
        author: 'Sofia Maria, 7 anos',
        synopsis:
          'Uma história encantadora sobre uma menina que descobre um mundo mágico cheio de cores, amizade e aventuras incríveis. Escrito e ilustrado com todo o carinho por uma jovem autora.',
        priceId: 'price-mock-sofia',
      },
    }),
  ]);

  console.log(`✅ ${books.length} livros criados/atualizados`);

  await Promise.all(
    mockBookPages.map((page) =>
      prisma.page.upsert({
        where: {
          bookId_number: {
            bookId: 'book-mock-sofia',
            number: page.number,
          },
        },
        update: {
          type: page.type,
          imageUrl: page.imageUrl,
          bookId: 'book-mock-sofia',
        },
        create: {
          number: page.number,
          type: page.type,
          imageUrl: page.imageUrl,
          bookId: 'book-mock-sofia',
        },
      }),
    ),
  );

  console.log(`✅ ${mockBookPages.length} páginas mock criadas/atualizadas`);
  console.log('📚 Livros no banco:');
  books.forEach((book) => {
    console.log(`  - ${book.title} (${book.author}) - ${book.magnificCode}`);
  });

  // Upsert do usuário
  console.log('👤 Criando/atualizando usuário...');
  const user = await prisma.user.upsert({
    where: { email: 'gui.soliveiras@gmail.com' },
    update: {
      name: 'Guilherme Soliveiras',
      picture: null,
      role: 'SCHOOL',
    },
    create: {
      email: 'gui.soliveiras@gmail.com',
      googleId: 'gui-soliveiras-001',
      name: 'Guilherme Soliveiras',
      picture: null,
      role: 'SCHOOL',
    },
  });

  console.log(`✅ Usuário criado/atualizado: ${user.email}`);

  // Associar usuário às unidades
  console.log('🔗 Associando usuário às unidades...');
  const userUnits = await Promise.all([
    prisma.userUnit.upsert({
      where: {
        userId_unitId: {
          userId: user.id,
          unitId: 'unit-001',
        },
      },
      update: {},
      create: {
        userId: user.id,
        unitId: 'unit-001',
      },
    }),
    prisma.userUnit.upsert({
      where: {
        userId_unitId: {
          userId: user.id,
          unitId: 'unit-002',
        },
      },
      update: {},
      create: {
        userId: user.id,
        unitId: 'unit-002',
      },
    }),
    prisma.userUnit.upsert({
      where: {
        userId_unitId: {
          userId: user.id,
          unitId: 'unit-003',
        },
      },
      update: {},
      create: {
        userId: user.id,
        unitId: 'unit-003',
      },
    }),
  ]);

  console.log(
    `✅ ${userUnits.length} associações de usuário-unidade criadas/atualizadas`,
  );

  console.log('\n🎫 Criando/atualizando eventos...');
  const events = await Promise.all([
    prisma.authographsEvent.upsert({
      where: { id: 'event-001' },
      update: {
        name: 'Sessão de autógrafos - Unidade Centro',
        date: new Date('2026-05-28T14:00:00.000Z'),
        schoolYear: 'YEAR_2026',
        status: AuthographsEventStatus.PLANNED,
        unitId: 'unit-001',
      },
      create: {
        id: 'event-001',
        name: 'Sessão de autógrafos - Unidade Centro',
        date: new Date('2026-05-28T14:00:00.000Z'),
        schoolYear: 'YEAR_2026',
        status: AuthographsEventStatus.PLANNED,
        unitId: 'unit-001',
      },
    }),
    prisma.authographsEvent.upsert({
      where: { id: 'event-002' },
      update: {
        name: 'Evento em andamento - Unidade Zona Oeste',
        date: new Date('2026-05-21T13:00:00.000Z'),
        schoolYear: 'YEAR_2026',
        status: AuthographsEventStatus.ONGOING,
        unitId: 'unit-002',
      },
      create: {
        id: 'event-002',
        name: 'Evento em andamento - Unidade Zona Oeste',
        date: new Date('2026-05-21T13:00:00.000Z'),
        schoolYear: 'YEAR_2026',
        status: AuthographsEventStatus.ONGOING,
        unitId: 'unit-002',
      },
    }),
    prisma.authographsEvent.upsert({
      where: { id: 'event-003' },
      update: {
        name: 'Evento concluído - Unidade Centro',
        date: new Date('2026-04-18T10:00:00.000Z'),
        schoolYear: 'YEAR_2026',
        status: AuthographsEventStatus.COMPLETED,
        unitId: 'unit-003',
      },
      create: {
        id: 'event-003',
        name: 'Evento concluído - Unidade Centro',
        date: new Date('2026-04-18T10:00:00.000Z'),
        schoolYear: 'YEAR_2026',
        status: AuthographsEventStatus.COMPLETED,
        unitId: 'unit-003',
      },
    }),
    prisma.authographsEvent.upsert({
      where: { id: 'event-004' },
      update: {
        name: 'Evento cancelado - Unidade Saúde',
        date: new Date('2026-03-10T09:00:00.000Z'),
        schoolYear: 'YEAR_2026',
        status: AuthographsEventStatus.CANCELED,
        unitId: 'unit-004',
      },
      create: {
        id: 'event-004',
        name: 'Evento cancelado - Unidade Saúde',
        date: new Date('2026-03-10T09:00:00.000Z'),
        schoolYear: 'YEAR_2026',
        status: AuthographsEventStatus.CANCELED,
        unitId: 'unit-004',
      },
    }),
  ]);

  console.log(`✅ ${events.length} eventos criados/atualizados`);
  console.log(`\n📋 Resumo do seed:`);
  console.log(`  Escolas: ${schools.length}`);
  console.log(`  Unidades: ${units.length}`);
  console.log(`  Eventos: ${events.length}`);
  console.log(`  Usuário: ${user.email} (${user.role})`);
  console.log(`  Unidades do usuário: ${userUnits.length}`);
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
