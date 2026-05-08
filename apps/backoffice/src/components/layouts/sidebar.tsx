import { useState } from 'react';
import {
  Building2,
  Users,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  hasMultipleUnits?: boolean;
}

export function Sidebar({ hasMultipleUnits = true }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    ...(hasMultipleUnits
      ? [{ icon: Building2, label: 'Unidades Escolares', path: '/' }]
      : []),
    { icon: Users, label: 'Turmas', path: '/turmas' },
    { icon: BookOpen, label: 'Livros', path: '/livros' },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className='relative flex flex-col bg-sidebar border-r border-sidebar-border h-screen'
    >
      {/* Logo */}
      <div className='flex items-center h-16 px-6 border-b border-sidebar-border'>
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className='overflow-hidden'
        >
          <div className='flex items-center gap-2'>
            <div className='w-9 h-9 rounded-lg bg-linear-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-sm'>
              <BookOpen className='w-5 h-5 text-white' />
            </div>
            {!collapsed && (
              <span className='font-semibold text-sidebar-foreground'>
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
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  'transition-all duration-200',
                  collapsed && 'justify-center',
                )}
              >
                <item.icon className='w-5 h-5 shrink-0' />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
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
          'flex items-center justify-center shadow-sm',
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
  );
}
