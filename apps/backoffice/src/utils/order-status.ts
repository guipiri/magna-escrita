import {
  CheckCircle2,
  Clock,
  Printer,
  RotateCcw,
  Truck,
  XCircle,
} from 'lucide-react';
import {
  FulfillmentStatusEnum,
  OrderStatusEnum,
} from '@repo/shared';

export interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
}

export function getPaymentStatusConfig(status: OrderStatusEnum): StatusConfig {
  switch (status) {
    case OrderStatusEnum.APPROVED:
      return {
        label: 'Aprovado',
        variant: 'success',
        icon: CheckCircle2,
      };
    case OrderStatusEnum.PENDING:
      return {
        label: 'Pendente',
        variant: 'warning',
        icon: Clock,
      };
    case OrderStatusEnum.CANCELED:
      return {
        label: 'Cancelado',
        variant: 'destructive',
        icon: XCircle,
      };
    case OrderStatusEnum.REFUNDED:
      return {
        label: 'Reembolsado',
        variant: 'secondary',
        icon: RotateCcw,
      };
    default:
      return {
        label: status,
        variant: 'outline',
        icon: Clock,
      };
  }
}

export function getFulfillmentStatusConfig(
  status: FulfillmentStatusEnum,
): StatusConfig {
  switch (status) {
    case FulfillmentStatusEnum.WAITING_PRINT:
      return {
        label: 'Aguardando impressão',
        variant: 'secondary',
        icon: Clock,
      };
    case FulfillmentStatusEnum.PRINTED:
      return {
        label: 'Impresso',
        variant: 'info',
        icon: Printer,
      };
    case FulfillmentStatusEnum.DELIVERED_TO_SCHOOL:
      return {
        label: 'Entregue à escola',
        variant: 'default',
        icon: Truck,
      };
    case FulfillmentStatusEnum.DELIVERED_TO_FAMILY:
      return {
        label: 'Entregue à família',
        variant: 'success',
        icon: CheckCircle2,
      };
    default:
      return {
        label: status,
        variant: 'outline',
        icon: Clock,
      };
  }
}

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatOrderDate(isoString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(isoString));
}
