import { IsEnum } from 'class-validator';
import {
  FulfillmentStatusEnum,
  type UpdateBookFulfillmentRequest,
} from '@repo/shared';

export class UpdateBookFulfillmentDto implements UpdateBookFulfillmentRequest {
  @IsEnum(FulfillmentStatusEnum)
  fulfillmentStatus!: FulfillmentStatusEnum;
}
