import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from '../payment.controller';
import { PaymentService } from '../payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;

  const mockService = {
    createOrder: jest.fn().mockResolvedValue({
      orderId: 'mock-order-id',
      status: 'pending',
    }),
    createPaymentWithPix: jest.fn(),
    handleWebhook: jest.fn().mockReturnValue({
      received: true,
      resourceId: '123',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create order', async () => {
    const orderData = {
      quantity: 1,
      price: 99.99,
      email: 'teste@example.com',
      token: 'mock-token',
      installments: 1,
      payment_method_id: 'master',
      issuer_id: 1,
    };

    const result = await controller.createOrder(orderData);

    expect(mockService.createOrder).toHaveBeenCalledWith(orderData);
    expect(result).toHaveProperty('orderId', 'mock-order-id');
  });

  it('should handle webhook', () => {
    const query = { type: 'payment', id: '123' };
    const body = { id: '456' };

    const result = controller.handleWebhook(query, body);

    expect(mockService.handleWebhook).toHaveBeenCalled();
    expect(result).toHaveProperty('received', true);
  });
});
