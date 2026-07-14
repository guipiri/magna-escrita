import type { BookStatus } from '@repo/shared';
import { BookStatusEnum } from '@repo/shared';
import { CheckCircle2, CircleDashed, Clock3, Eye, Sparkles } from 'lucide-react';
import type { ElementType } from 'react';

export interface BookStatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: ElementType;
  bgColor?: string;
}

export function getBookStatusConfig(status: BookStatus): BookStatusConfig {
  switch (status) {
    case BookStatusEnum.READY_FOR_SALE:
      return {
        label: 'Pronto para venda',
        variant: 'default',
        icon: Sparkles,
        bgColor: 'bg-emerald-600',
      };
    case BookStatusEnum.REVISED_BY_MAGNA:
      return {
        label: 'Revisado pela Magna',
        variant: 'default',
        icon: CheckCircle2,
        bgColor: 'bg-emerald-600',
      };
    case BookStatusEnum.REVISED_BY_SCHOOL:
      return {
        label: 'Revisado pela escola',
        variant: 'default',
        icon: Clock3,
        bgColor: 'bg-amber-600',
      };
    case BookStatusEnum.ARCHIVED:
      return {
        label: 'Arquivado',
        variant: 'outline',
        icon: Eye,
        bgColor: 'bg-red-100',
      };
    case BookStatusEnum.DRAFT:
    default:
      return {
        label: 'Rascunho',
        variant: 'outline',
        icon: CircleDashed,
        bgColor: 'bg-gray-100',
      };
  }
}
