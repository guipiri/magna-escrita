import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [PaymentService],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPreference', () => {
    it('should call service with correct parameters', async () => {
      const paymentData = {
        title: 'Produto Teste',
        quantity: 1,
        price: 99.99,
        description: 'Descrição de teste',
        email: 'teste@example.com',
      };

      const serviceSpyOn = jest
        .spyOn(service, 'createPreference')
        .mockResolvedValue({
          id: 'mock-id',
          init_point: 'mock-init-point',
          sandbox_init_point: 'mock-sandbox-init-point',
        });

      const result = await controller.createPreference(paymentData);

      expect(serviceSpyOn).toHaveBeenCalledWith(paymentData);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
    });
  });

  describe('paymentSuccess', () => {
    it('should return success message', async () => {
      const result = await controller.paymentSuccess();

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('sucesso');
    });
  });

  describe('paymentFailure', () => {
    it('should return failure message', async () => {
      const result = await controller.paymentFailure();

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('falhou');
    });
  });

  describe('paymentPending', () => {
    it('should return pending message', async () => {
      const result = await controller.paymentPending();

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('pendente');
    });
  });
});
