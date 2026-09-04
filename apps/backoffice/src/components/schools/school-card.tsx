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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className='bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group'
      onClick={onClick}
    >
      {/* Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-start gap-3'>
          <div className='size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
            <Building2 className='size-5.5' />
          </div>
          <div>
            <h3 className='font-semibold text-card-foreground group-hover:text-primary transition-colors'>
              {school.name}
            </h3>
            <div className='flex items-center gap-2 mt-1'>
              <Calendar className='size-3.5 text-muted-foreground' />
              <span className='text-xs text-muted-foreground'>
                {school.lastActivity}
              </span>
            </div>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-3 mb-4'>
        <div className='flex items-center gap-2 p-2 rounded-lg border border-border/70 bg-muted/20'>
          <div className='size-8 rounded-md bg-muted flex items-center justify-center shrink-0'>
            <GraduationCap className='size-4 text-foreground' />
          </div>
          <div className='min-w-0'>
            <p className='text-xs text-muted-foreground truncate'>Turmas</p>
            <p className='text-sm font-semibold text-card-foreground'>
              {school.classCount}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2 p-2 rounded-lg border border-border/70 bg-muted/20'>
          <div className='size-8 rounded-md bg-muted flex items-center justify-center shrink-0'>
            <Users className='size-4 text-foreground' />
          </div>
          <div className='min-w-0'>
            <p className='text-xs text-muted-foreground truncate'>Alunos</p>
            <p className='text-sm font-semibold text-card-foreground'>
              {school.studentCount}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2 p-2 rounded-lg border border-border/70 bg-muted/20'>
          <div className='size-8 rounded-md bg-muted flex items-center justify-center shrink-0'>
            <BookOpen className='size-4 text-foreground' />
          </div>
          <div className='min-w-0'>
            <p className='text-xs text-muted-foreground truncate'>Livros</p>
            <p className='text-sm font-semibold text-card-foreground'>
              {school.bookCount}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='flex gap-2'>
        <Button variant='outline' className='flex-1 justify-between' onClick={onClick}>
          <span>Visualizar</span>
          <ArrowRight className='size-4 group-hover:translate-x-1 transition-transform' />
        </Button>
      </div>
    </motion.div>
  );
}
