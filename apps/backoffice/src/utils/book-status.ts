import type { BookStatus } from '@repo/shared';
import { BookStatusEnum } from '@repo/shared';
import { CheckCircle2, CircleDashed, Clock3, Eye, Sparkles } from 'lucide-react';
import type { ElementType } from 'react';

export interface BookStatusConfig {
  label: string;
  variant:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'destructive'
    | 'success'
    | 'warning'
    | 'info';
  icon: ElementType;
  bgColor?: string;
}

export function getBookStatusConfig(status: BookStatus): BookStatusConfig {
  switch (status) {
    case BookStatusEnum.READY_FOR_SALE:
      return {
        label: 'Pronto para venda',
        variant: 'success',
        icon: Sparkles,
      };
    case BookStatusEnum.REVISED_BY_MAGNA:
      return {
        label: 'Revisado pela Magna',
        variant: 'info',
        icon: CheckCircle2,
      };
    case BookStatusEnum.REVISED_BY_SCHOOL:
      return {
        label: 'Revisado pela escola',
        variant: 'warning',
        icon: Clock3,
      };
    case BookStatusEnum.ARCHIVED:
      return {
        label: 'Arquivado',
        variant: 'secondary',
        icon: Eye,
      };
    case BookStatusEnum.DRAFT:
    default:
      return {
        label: 'Rascunho',
        variant: 'outline',
        icon: CircleDashed,
      };
  }
}
