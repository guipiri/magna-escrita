export enum OrderStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
}

export enum FulfillmentStatusEnum {
  WAITING_PRINT = 'WAITING_PRINT',
  PRINTED = 'PRINTED',
  DELIVERED_TO_SCHOOL = 'DELIVERED_TO_SCHOOL',
  DELIVERED_TO_FAMILY = 'DELIVERED_TO_FAMILY',
}

export interface BackofficeOrderItemBook {
  id: string;
  magnificCode: string;
  title: string | null;
  interiorPdfUrl: string | null;
  coverPdfUrl: string | null;
  student: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
      schoolYear: string;
      units: {
        id: string;
        name: string | null;
        school: {
          id: string;
          name: string;
        };
      };
    };
  };
}

export interface BackofficeOrderItem {
  orderId: string;
  bookId: string;
  quantity: number;
  amount: number | null;
  fulfillmentStatus: FulfillmentStatusEnum;
  printedAt: string | null;
  deliveredToSchoolAt: string | null;
  deliveredToFamilyAt: string | null;
  createdAt: string;
  updatedAt: string;
  book: BackofficeOrderItemBook;
}

export interface BackofficeOrderUser {
  id: string;
  name: string | null;
  email: string;
}

export interface BackofficeOrder {
  id: string;
  mpId: string;
  status: OrderStatusEnum;
  fulfillmentStatus: FulfillmentStatusEnum;
  paymentMethod: string;
  paymentMethodDetail: string | null;
  totalAmount: number | null;
  email: string;
  installments: number;
  createdAt: string;
  updatedAt: string;
  deliveredToFamilyAt: string | null;
  user: BackofficeOrderUser;
  items: BackofficeOrderItem[];
}

export type GetBackofficeOrdersResponse = BackofficeOrder[];

export interface DeliverOrderToFamilyResponse {
  success: boolean;
  orderId: string;
  fulfillmentStatus: FulfillmentStatusEnum;
  deliveredToFamilyAt: string;
}

export interface RevertOrderFamilyDeliveryResponse {
  success: boolean;
  orderId: string;
  fulfillmentStatus: FulfillmentStatusEnum;
}

export interface EventBookProductionOrder {
  orderId: string;
  buyerName: string | null;
  buyerEmail: string;
  quantity: number;
  fulfillmentStatus: FulfillmentStatusEnum;
  printedAt: string | null;
  deliveredToSchoolAt: string | null;
  deliveredToFamilyAt: string | null;
  orderCreatedAt: string;
}

export interface EventBookProductionItem {
  bookId: string;
  magnificCode: string;
  title: string | null;
  interiorPdfUrl: string | null;
  coverPdfUrl: string | null;
  student: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
      schoolYear: string;
      units: {
        id: string;
        name: string | null;
        school: {
          id: string;
          name: string;
        };
      };
    };
  };
  totalQuantity: number;
  waitingPrintQuantity: number;
  printedQuantity: number;
  deliveredToSchoolQuantity: number;
  deliveredToFamilyQuantity: number;
  orders: EventBookProductionOrder[];
}

export type GetEventBookProductionResponse = EventBookProductionItem[];

export interface UpdateOrderItemFulfillmentRequest {
  fulfillmentStatus: FulfillmentStatusEnum;
}

export interface UpdateBookFulfillmentRequest {
  fulfillmentStatus: FulfillmentStatusEnum;
}

export interface UpdateFulfillmentResponse {
  success: boolean;
  message?: string;
}
