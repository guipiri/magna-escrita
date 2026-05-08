import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Breadcrumb } from './breadcrumb';

export function MainLayout() {
  return (
    <div className='flex h-screen bg-background'>
      {/* Sidebar */}
      <Sidebar hasMultipleUnits={true} />
      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <Header
          academicYears={[{ value: '2026', label: 'Ano Letivo 2026' }]}
          selectedYear={'2026'}
          onYearChange={() => {}}
          userName='Professora Maria Silva'
        />

        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Início', href: '/' }]} />
        <Outlet />
      </div>
    </div>
  );
}
