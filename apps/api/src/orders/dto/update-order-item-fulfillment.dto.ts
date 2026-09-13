import { IsEnum } from 'class-validator';
import {
  FulfillmentStatusEnum,
  type UpdateOrderItemFulfillmentRequest,
} from '@repo/shared';

export class UpdateOrderItemFulfillmentDto implements UpdateOrderItemFulfillmentRequest {
  @IsEnum(FulfillmentStatusEnum)
  fulfillmentStatus!: FulfillmentStatusEnum;
}
