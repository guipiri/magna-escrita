import { useState } from 'react';
import {
  Building2,
  Users,
  BookOpen,
  CalendarDays,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/use-is-mobile';
import { useAuth } from '../../hooks/auth-hook';
import { UserRole } from '@repo/shared';

interface SidebarProps {
  hasMultipleUnits?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  hasMultipleUnits = true,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const menuItems = [
    ...(hasMultipleUnits
      ? [{ icon: Building2, label: 'Unidades Escolares', path: '/' }]
      : []),
    { icon: Users, label: 'Turmas', path: '/turmas' },
    { icon: CalendarDays, label: 'Eventos', path: '/eventos' },
    { icon: BookOpen, label: 'Livros', path: '/livros' },
    ...(isAdmin
      ? [{ icon: LayoutTemplate, label: 'Book Templates', path: '/book-templates' }]
      : []),
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const isLogoVisible = !isMobile ? !collapsed : true;

  return (
    <>
      {/* Backdrop */}
      {isMobile && isMobileOpen && (
        <div
          className='fixed inset-0 bg-black/40 z-40 md:hidden'
          onClick={onCloseMobile}
        />
      )}

      <motion.aside
        initial={false}
        animate={
          isMobile
            ? { x: isMobileOpen ? 0 : -260, width: 260 }
            : { x: 0, width: collapsed ? 80 : 260 }
        }
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'flex flex-col bg-sidebar border-r border-sidebar-border h-screen',
          'fixed inset-y-0 left-0 z-50 md:relative',
        )}
      >
        {/* Logo */}
        <div className='flex items-center h-16 px-6 border-b border-sidebar-border'>
          <motion.div
            animate={{ opacity: isLogoVisible ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className='overflow-hidden'
          >
            <div className='flex items-center gap-2'>
              <div className='w-9 h-9 rounded-lg bg-linear-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-sm'>
                <BookOpen className='w-5 h-5 text-white' />
              </div>
              {isLogoVisible && (
                <span className='font-semibold text-sidebar-foreground whitespace-nowrap'>
                  Livros Mágicos
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 p-3'>
          <ul className='space-y-1'>
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleItemClick(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                    'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    'transition-all duration-200',
                    collapsed && !isMobile && 'justify-center',
                  )}
                >
                  <item.icon className='w-5 h-5 shrink-0' />
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className='whitespace-nowrap'
                    >
                      {item.label}
                    </motion.span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border',
            'hidden md:flex items-center justify-center shadow-sm',
            'hover:bg-accent transition-colors duration-200',
          )}
        >
          {collapsed ? (
            <ChevronRight className='w-3.5 h-3.5' />
          ) : (
            <ChevronLeft className='w-3.5 h-3.5' />
          )}
        </button>
      </motion.aside>
    </>
  );
}
