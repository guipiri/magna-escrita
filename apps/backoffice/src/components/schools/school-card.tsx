import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { motion } from 'motion/react';

export interface SchoolData {
  id: string;
  name: string;
  classCount: number;
  studentCount: number;
  bookCount: number;
  status: 'active' | 'in-progress' | 'completed';
  lastActivity: string;
}

interface SchoolCardProps {
  school: SchoolData;
  onClick?: () => void;
}

const statusConfig = {
  active: { label: 'Ativo', variant: 'success' as const },
  'in-progress': { label: 'Em Andamento', variant: 'warning' as const },
  completed: { label: 'Concluído', variant: 'default' as const },
};

export function SchoolCard({ school, onClick }: SchoolCardProps) {
  const status = statusConfig[school.status];
  const badgeVariant =
    school.status === 'active'
      ? 'default'
      : school.status === 'completed'
        ? 'secondary'
        : 'outline';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className='bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group'
      onClick={onClick}
    >
      {/* Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-start gap-3'>
          <div className='w-12 h-12 rounded-md bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0'>
            <Building2 className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='font-semibold text-card-foreground group-hover:text-primary transition-colors'>
              {school.name}
            </h3>
            <div className='flex items-center gap-2 mt-1'>
              <Calendar className='w-3.5 h-3.5 text-muted-foreground' />
              <span className='text-xs text-muted-foreground'>
                {school.lastActivity}
              </span>
            </div>
          </div>
        </div>
        <Badge variant={badgeVariant}>{status.label}</Badge>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-4 mb-4'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-sm bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center'>
            <GraduationCap className='w-4 h-4 text-purple-600 dark:text-purple-400' />
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Turmas</p>
            <p className='text-sm font-semibold text-card-foreground'>
              {school.classCount}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-sm bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center'>
            <Users className='w-4 h-4 text-blue-600 dark:text-blue-400' />
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Alunos</p>
            <p className='text-sm font-semibold text-card-foreground'>
              {school.studentCount}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-sm bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center'>
            <BookOpen className='w-4 h-4 text-pink-600 dark:text-pink-400' />
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Livros</p>
            <p className='text-sm font-semibold text-card-foreground'>
              {school.bookCount}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='flex gap-2'>
        <Button variant='outline' className='flex-1' onClick={onClick}>
          Visualizar
          <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
        </Button>
      </div>
    </motion.div>
  );
}
