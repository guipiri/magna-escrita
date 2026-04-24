/**
 * Tipos para o Sistema de Pagamentos Mercado Pago
 */

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back',
}

export enum PaymentStatusDetail {
  ACCREDITED = 'accredited',
  PENDING_CONTINGENCY = 'pending_contingency',
  PENDING_REVIEW_MANUAL = 'pending_review_manual',
  PENDING_CAPTURE = 'pending_capture',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CC_REJECTED_BAD_FILLED_CARD_NUMBER = 'cc_rejected_bad_filled_card_number',
  CC_REJECTED_BAD_FILLED_EXPIRATION_DATE = 'cc_rejected_bad_filled_expiration_date',
  CC_REJECTED_BAD_FILLED_SECURITY_CODE = 'cc_rejected_bad_filled_security_code',
  CC_REJECTED_BLACKLIST = 'cc_rejected_blacklist',
  CC_REJECTED_CALL_FOR_AUTHORIZE = 'cc_rejected_call_for_authorize',
  CC_REJECTED_CARD_DISABLED = 'cc_rejected_card_disabled',
  CC_REJECTED_INSUFFICIENT_AMOUNT = 'cc_rejected_insufficient_amount',
  CC_REJECTED_INVALID_INSTALLMENTS = 'cc_rejected_invalid_installments',
  CC_REJECTED_OTHER_REASON = 'cc_rejected_other_reason',
}

export interface PaymentItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  description?: string;
}

export interface PaymentPayer {
  email?: string;
  name?: string;
  surname?: string;
  phone?: {
    area_code?: string;
    number?: string;
  };
  identification?: {
    type?: string;
    number?: string;
  };
  address?: {
    street_name?: string;
    street_number?: number;
    zip_code?: string;
    city_name?: string;
    state_name?: string;
  };
}

export interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface Payment {
  id: string;
  status: PaymentStatus;
  status_detail: PaymentStatusDetail;
  transaction_amount: number;
  currency_id: string;
  description: string;
  email?: string;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
}

export interface PaymentWebhookData {
  id: string;
  live_mode: boolean;
  type: string;
  date_created: string;
  user_id: number;
  resource: string;
  topic: string;
  action: string;
}

export interface CreatePreferenceRequest {
  title: string;
  quantity: number;
  price: number;
  description?: string;
  email?: string;
}

export interface PaymentResponse {
  success: boolean;
  data?: any;
  error?: string;
}
