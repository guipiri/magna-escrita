import { LogOut } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/auth-hook';

export function MainLayout() {
  const { logout } = useAuth();
  return (
    <div className='min-h-screen flex flex-col'>
      <header className='bg-gray-800 text-white p-4 flex items-center justify-between'>
        <h1 className='text-xl font-bold'>Backoffice</h1>
        <button
          className='hover:cursor-pointer hover:bg-red-400 transition-all text-white py-2 px-4 rounded'
          onClick={() => logout()}
        >
          <LogOut />
        </button>
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
