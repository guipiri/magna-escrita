import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Breadcrumb } from './breadcrumb';
import { routes } from '../../main';
import { useAuth } from '../../hooks/auth-hook';
import { UserRole } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { getSchoolUnits } from '../../services/schools-service';

export function MainLayout() {
  const { pathname } = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  const { data: schools } = useQuery({
    queryKey: ['school-units'],
    queryFn: getSchoolUnits,
    enabled: user?.role === UserRole.SCHOOL,
  });

  const allUnits =
    schools?.flatMap((school) =>
      school.units.map((unit) => ({
        schoolName: school.name,
        unitName: unit.name,
      })),
    ) ?? [];

  const schoolUnitName =
    user?.role === UserRole.SCHOOL && allUnits.length === 1
      ? `${allUnits[0].schoolName} - ${allUnits[0].unitName || 'Unidade principal'}`
      : undefined;

  const roleLabel = user?.role === UserRole.ADMIN ? 'Administrador' : 'Escola';

  const breadcrumbItems = [
    ...(pathname === routes.schools.path
      ? [{ label: 'Escolas', href: routes.schools.path }]
      : pathname === routes.classes.path
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
          userName={user?.name || 'Usuário'}
          userRole={roleLabel}
          userAvatar={user?.picture || undefined}
          selectedUnit={schoolUnitName}
          onMenuToggle={() => setIsMobileOpen(true)}
        />

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />
        <Outlet />
      </div>
    </div>
  );
}
