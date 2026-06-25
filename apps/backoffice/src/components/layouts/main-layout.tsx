import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Breadcrumb } from './breadcrumb';
import { routes } from '../../main';

export function MainLayout() {
  const { pathname } = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const breadcrumbItems = [
    { label: 'Escolas', href: routes.schools.path },
    ...(pathname === routes.classes.path
      ? [{ label: 'Turmas' }]
      : pathname === routes.events.path
        ? [{ label: 'Eventos' }]
        : pathname === routes.books.path
          ? [{ label: 'Livros' }]
          : pathname === routes.users.path
            ? [{ label: 'Usuários' }]
            : pathname === routes.bookTemplates.path
              ? [{ label: 'Book Templates' }]
              : pathname.startsWith(routes.books.path)
                ? [
                    { label: 'Livros', href: routes.books.path },
                    { label: 'Detalhe do livro' },
                  ]
                : []),
  ];

  return (
    <div className='flex h-screen bg-background'>
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <Header
          academicYears={[{ value: '2026', label: 'Ano Letivo 2026' }]}
          selectedYear={'2026'}
          onYearChange={() => {}}
          userName='Professora Maria Silva'
          onMenuToggle={() => setIsMobileOpen(true)}
        />

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />
        <Outlet />
      </div>
    </div>
  );
}
