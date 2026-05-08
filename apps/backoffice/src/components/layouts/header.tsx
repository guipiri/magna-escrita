import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface HeaderProps {
  selectedUnit?: string;
  academicYears?: { value: string; label: string }[];
  selectedYear?: string;
  onYearChange?: (year: string) => void;
  userName?: string;
  userAvatar?: string;
}

export function Header({
  selectedUnit,
  academicYears = [],
  selectedYear,
  onYearChange,
  userName = 'Professora Maria',
  userAvatar,
}: HeaderProps) {
  const showYearSelector = academicYears.length > 1;

  return (
    <header className='h-16 border-b border-border bg-background flex items-center justify-between px-6'>
      <div className='flex items-center gap-4'>
        {selectedUnit && (
          <div className='text-foreground'>
            <span className='opacity-60 text-sm mr-2'>Unidade:</span>
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
          <div className='text-right'>
            <p className='text-sm font-medium text-foreground'>{userName}</p>
            <p className='text-xs text-muted-foreground'>Coordenadora</p>
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

        <button
          className='p-2 hover:bg-accent rounded-md transition-colors duration-200'
          title='Sair'
        >
          <LogOut className='w-5 h-5 text-muted-foreground' />
        </button>
      </div>
    </header>
  );
}
