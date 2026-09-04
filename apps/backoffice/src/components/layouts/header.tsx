import { LogOut, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useAuth } from '../../hooks/auth-hook';

interface HeaderProps {
  selectedUnit?: string;
  academicYears?: { value: string; label: string }[];
  selectedYear?: string;
  onYearChange?: (year: string) => void;
  userName: string;
  userRole: string;
  userAvatar?: string;
  onMenuToggle?: () => void;
}

export function Header({
  selectedUnit,
  academicYears = [],
  selectedYear,
  onYearChange,
  userName,
  userRole,
  userAvatar,
  onMenuToggle,
}: HeaderProps) {
  const { logout } = useAuth();

  const showYearSelector = academicYears.length > 1;

  return (
    <header className='h-16 border-b border-border bg-background flex items-center justify-between px-6'>
      <div className='flex items-center gap-4'>
        {onMenuToggle && (
          <Button
            variant='ghost'
            size='icon'
            onClick={onMenuToggle}
            className='md:hidden -ml-2 text-muted-foreground'
            aria-label='Menu'
            title='Menu'
          >
            <Menu className='size-5' />
          </Button>
        )}
        {selectedUnit && (
          <div className='text-foreground hidden sm:block'>
            <span className='font-medium'>{selectedUnit}</span>
          </div>
        )}
      </div>

      <div className='flex items-center gap-4'>
        {showYearSelector && (
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className='w-45'>
              <SelectValue placeholder='Selecione o ano' />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className='flex items-center gap-3'>
          <div className='text-right hidden sm:block'>
            <p className='text-sm font-medium text-foreground'>{userName}</p>
            <p className='text-xs text-muted-foreground'>{userRole}</p>
          </div>
          <Avatar>
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>
              {userName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
        </div>

        <Button
          variant='ghost'
          size='icon'
          onClick={() => logout()}
          className='text-muted-foreground hover:text-foreground'
          aria-label='Sair'
          title='Sair'
        >
          <LogOut className='size-5' />
        </Button>
      </div>
    </header>
  );
}
