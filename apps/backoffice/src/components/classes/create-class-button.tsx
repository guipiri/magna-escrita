import { Users } from 'lucide-react';
import { Button } from '../ui/button';

export function CreateClassButton({
  children,
  onClick,
  ...rest
}: {
  onClick?: () => void;
  childre?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button variant='outline' onClick={onClick} {...rest}>
      <Users />
      {children}
    </Button>
  );
}
