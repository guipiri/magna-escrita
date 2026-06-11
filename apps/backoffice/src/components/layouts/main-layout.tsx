import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Breadcrumb } from './breadcrumb';

export function MainLayout() {
  const { pathname } = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const breadcrumbItems = [
    { label: 'Início', href: '/' },
    ...(pathname === '/turmas'
      ? [{ label: 'Turmas' }]
      : pathname === '/eventos'
        ? [{ label: 'Eventos' }]
        : pathname === '/livros'
          ? [{ label: 'Livros' }]
          : pathname.startsWith('/livros/')
            ? [
                { label: 'Livros', href: '/livros' },
                { label: 'Detalhe do livro' },
              ]
            : []),
  ];

  return (
    <div className='flex h-screen bg-background'>
      {/* Sidebar */}
      <Sidebar
        hasMultipleUnits={true}
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
