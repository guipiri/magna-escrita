# Exemplos de Uso - Sistema de Pagamentos Mercado Pago

## 1. Configuração Inicial

### Backend (.env)

```env
MERCADOPAGO_ACCESS_TOKEN=APP_1234567890123456789012345
APP_URL=http://localhost:5173
API_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:3000
```

## 2. Usando o Componente de Checkout

### Exemplo Simples

```tsx
import { MercadoPagoCheckout } from '@/components/MercadoPagoCheckout';

export function Store() {
  return (
    <div>
      <h1>Loja</h1>
      <MercadoPagoCheckout />
    </div>
  );
}
```

### Com Callbacks

```tsx
import { MercadoPagoCheckout } from '@/components/MercadoPagoCheckout';

export function CheckoutPage() {
  const handleSuccess = (preferenceId: string) => {
    console.log('Pagamento criado:', preferenceId);
    // Salvar preferenceId no banco de dados
    // Rastrear conversion
  };

  const handleError = (error: Error) => {
    console.error('Erro:', error.message);
    // Mostrar notificação de erro
    // Logar erro para monitoramento
  };

  return (
    <MercadoPagoCheckout onSuccess={handleSuccess} onError={handleError} />
  );
}
```

## 3. Usando o Serviço de Pagamentos

### Criar Preferência

```tsx
import { createPaymentPreference } from '@/services/paymentService';

async function handleCheckout() {
  try {
    const preference = await createPaymentPreference({
      title: 'Notebook',
      quantity: 1,
      price: 2999.99,
      description: 'Notebook Gamer',
      email: 'cliente@example.com',
    });

    // Redirecionar para Mercado Pago
    window.location.href = preference.init_point;
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
  }
}
```

### Obter Status de Pagamento

```tsx
import { getPaymentStatus } from '@/services/paymentService';

async function checkPaymentStatus(paymentId: string) {
  try {
    const payment = await getPaymentStatus(paymentId);

    console.log('Status:', payment.status);
    console.log('Valor:', payment.transaction_amount);
  } catch (error) {
    console.error('Erro ao buscar status:', error);
  }
}
```

## 4. Endpoints da API

### Criar Preferência

```bash
curl -X POST http://localhost:3000/payment/create-preference \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Produto",
    "quantity": 1,
    "price": 99.99,
    "description": "Descrição",
    "email": "usuario@example.com"
  }'
```

**Resposta:**

```json
{
  "id": "1234567890",
  "init_point": "https://www.mercadopago.com/checkout/v1/...",
  "sandbox_init_point": "https://sandbox.mercadopago.com/checkout/v1/..."
}
```

### Obter Status

```bash
curl http://localhost:3000/payment/status/1234567890
```

**Resposta:**

```json
{
  "id": "1234567890",
  "status": "approved",
  "status_detail": "accredited",
  "transaction_amount": 99.99,
  "description": "Produto"
}
```

## 5. Tratando Webhooks

O sistema automaticamente recebe notificações do Mercado Pago quando um pagamento muda de status.

### Exemplo de Implementação Completa

```typescript
// payment.service.ts
async handleWebhook(data: any) {
  const { type, data: webhookData } = data;

  if (type === 'payment') {
    const payment = await this.getPaymentStatus(webhookData.id);

    // Verificar status
    if (payment.status === 'approved') {
      // Processar pagamento aprovado
      await this.processApprovedPayment(webhookData.id);
    } else if (payment.status === 'rejected') {
      // Processar pagamento recusado
      await this.processRejectedPayment(webhookData.id);
    }

    return { received: true };
  }
}

async processApprovedPayment(paymentId: string) {
  // Atualizar banco de dados
  // Enviar email de confirmação
  // Gerar nota fiscal
  // etc.
}
```

## 6. Testando com Cartões de Teste

### Cartões Disponíveis (Modo Sandbox)

| Resultado | Número              | Vencimento | CVV                |
| --------- | ------------------- | ---------- | ------------------ |
| Aprovado  | 4111 1111 1111 1111 | Qualquer   | Qualquer 3 dígitos |
| Pendente  | 5105 1051 0510 5100 | Qualquer   | Qualquer 3 dígitos |
| Recusado  | 4000 0000 0000 0002 | Qualquer   | Qualquer 3 dígitos |

### Dados de Teste

- **CPF**: 00000000000
- **Código de Segurança**: Qualquer 3 dígitos
- **Vencimento**: Qualquer data futura (MM/AA)

## 7. Fluxo Completo de Pagamento

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       ├─ Preenche formulário
       │
       ▼
┌─────────────────────────┐
│  MercadoPagoCheckout    │
│     (Frontend)          │
└──────┬──────────────────┘
       │
       ├─ POST /payment/create-preference
       │
       ▼
┌─────────────────────────┐
│  PaymentController      │
│      (Backend)          │
└──────┬──────────────────┘
       │
       ├─ Valida dados
       │
       ▼
┌─────────────────────────┐
│  PaymentService         │
└──────┬──────────────────┘
       │
       ├─ Comunica com Mercado Pago
       │
       ▼
┌─────────────────────────┐
│   Mercado Pago API      │
└──────┬──────────────────┘
       │
       ├─ Cria preferência
       │
       ▼
┌─────────────────────────┐
│  Retorna init_point     │
└──────┬──────────────────┘
       │
       ├─ Redireciona usuário
       │
       ▼
┌─────────────────────────┐
│  Checkout Mercado Pago  │
└──────┬──────────────────┘
       │
       ├─ Usuário preenche dados do cartão
       │
       ├─ Processa pagamento
       │
       ▼
┌─────────────────────────┐
│  Payment Gateway        │
└──────┬──────────────────┘
       │
       ├─ Aprova/Recusa
       │
       ▼
┌─────────────────────────┐
│  Redireciona de volta   │
│   (success/failure)     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  PaymentStatusPage      │
│   (Resultado final)     │
└─────────────────────────┘
```

## 8. Tratamento de Erros

```tsx
async function handlePayment() {
  try {
    const preference = await createPaymentPreference(paymentData);
    window.location.href = preference.init_point;
  } catch (error) {
    if (error instanceof Error) {
      // Erro de validação
      if (error.message.includes('validação')) {
        showNotification('Verifique os dados informados', 'error');
      }
      // Erro de rede
      else if (error.message.includes('rede')) {
        showNotification('Erro de conexão. Tente novamente', 'error');
      }
      // Erro genérico
      else {
        showNotification('Erro ao processar pagamento', 'error');
      }
    }
  }
}
```

## 9. Próximas Implementações

- [ ] Salvar histórico de pagamentos no banco de dados
- [ ] Adicionar autenticação de usuários
- [ ] Implementar suporte a múltiplas moedas
- [ ] Adicionar parcelamento
- [ ] Implementar refunds
- [ ] Adicionar testes E2E
- [ ] Implementar dashboard de relatórios
- [ ] Integrar com sistema de notificações por email

## 10. Segurança

✅ **Implementado:**

- Access token em variáveis de ambiente
- URLs de callback configuráveis
- Validação básica de dados

⚠️ **TODO:**

- Validar assinatura de webhooks
- Implementar rate limiting
- Adicionar CORS correto
- Criptografar dados sensíveis
- Implementar logging de segurança
- Validação de HTTPS em produção
