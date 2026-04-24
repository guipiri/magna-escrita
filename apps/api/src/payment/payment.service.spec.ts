import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentService],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPreference', () => {
    it('should create a payment preference', async () => {
      const paymentData = {
        title: 'Produto Teste',
        quantity: 1,
        price: 99.99,
        description: 'Descrição de teste',
        email: 'teste@example.com',
      };

      // Este teste requer um Access Token válido
      // Para rodar este teste, defina a variável de ambiente MERCADOPAGO_ACCESS_TOKEN
      if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
        const result = await service.createPreference(paymentData);

        expect(result).toBeDefined();
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('sandbox_init_point');
      }
    });
  });

  describe('getPaymentStatus', () => {
    it('should handle non-existent payment', async () => {
      // Este teste requer um Access Token válido e um ID de pagamento inválido
      if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
        await expect(service.getPaymentStatus('invalid_id')).rejects.toThrow();
      }
    });
  });
});
