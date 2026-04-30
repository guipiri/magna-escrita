import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { MercadoPagoProvider } from './providers/mercado-pago.provider';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: MercadoPagoProvider,
          useValue: {
            order: { create: jest.fn(), get: jest.fn() },
            payment: { create: jest.fn(), get: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle payment webhook', () => {
    const result = service.handleWebhook({
      type: 'payment',
      data: { id: '123' },
    });

    expect(result).toEqual({
      received: true,
      resourceId: '123',
    });
  });

  it('should handle order webhook', () => {
    const result = service.handleWebhook({
      type: 'order',
      data: { id: '456' },
    });

    expect(result).toEqual({
      received: true,
      resourceId: '456',
    });
  });

  it('should return received true for unknown type', () => {
    const result = service.handleWebhook({
      type: 'unknown',
      data: { id: '789' },
    });

    expect(result).toEqual({ received: true });
  });
});
