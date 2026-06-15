import { BookPlus, ChevronDown, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface CreateBookButtonProps {
  onBulkUpload: () => void;
  className?: string;
}

export function CreateBookButton({
  onBulkUpload,
  className,
}: CreateBookButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type='button' className={className} variant='outline'>
          <BookPlus className='h-4 w-4' />
          Criar livro
          <ChevronDown className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-52' onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuLabel>Opções de criação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onBulkUpload}
          className='cursor-pointer hover:bg-muted'
        >
          <Upload className='h-4 w-4' />
          Upload em massa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
