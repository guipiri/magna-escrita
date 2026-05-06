import { Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <div className='min-h-screen flex flex-col'>
      <header className='bg-gray-800 text-white p-4'>
        <h1 className='text-xl font-bold'>Backoffice</h1>
      </header>
      <main className='flex-1 p-4'>
        <Outlet />
      </main>
      <footer className='bg-gray-200 text-center p-4'>
        &copy; {new Date().getFullYear()} Magna Escrita. All rights reserved.
      </footer>
    </div>
  );
}
