# Sistema de Pagamentos - Mercado Pago

Este é um sistema simples de pagamentos integrado com Mercado Pago para o monorepo.

## 📋 Estrutura

### Backend (NestJS)

- **`payment.service.ts`**: Serviço que gerencia a integração com Mercado Pago
- **`payment.controller.ts`**: Endpoints REST para operações de pagamento
- **`payment.module.ts`**: Módulo NestJS que agrupa o serviço e controller

### Frontend (React + Vite)

- **`services/paymentService.ts`**: Cliente HTTP para comunicação com a API
- **`components/MercadoPagoCheckout.tsx`**: Componente de formulário de checkout
- **`pages/PaymentStatusPage.tsx`**: Página de confirmação de pagamento

## 🚀 Configuração

### 1. Obter credenciais do Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma conta ou faça login
3. Vá para "Credenciais" na dashboard
4. Copie o **Access Token** (production ou sandbox)

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na pasta `apps/api/`:

```env
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
APP_URL=http://localhost:5173
API_URL=http://localhost:3000
```

Crie um arquivo `.env.local` na pasta `apps/web/`:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Instalar dependências

```bash
yarn install
```

### 4. Executar a aplicação

```bash
# Terminal 1 - Backend
cd apps/api
yarn dev

# Terminal 2 - Frontend
cd apps/web
yarn dev
```

## 📚 Endpoints da API

### Criar Preferência de Pagamento

**POST** `/payment/create-preference`

```json
{
  "title": "Produto Exemplo",
  "quantity": 1,
  "price": 99.99,
  "description": "Descrição do produto",
  "email": "usuario@example.com"
}
```

**Resposta:**

```json
{
  "id": "123456789",
  "init_point": "https://www.mercadopago.com/checkout/v1/...",
  "sandbox_init_point": "https://sandbox.mercadopago.com/checkout/v1/..."
}
```

### Obter Status do Pagamento

**GET** `/payment/status/:paymentId`

**Resposta:**

```json
{
  "id": "123456789",
  "status": "approved",
  "status_detail": "accredited",
  "transaction_amount": 99.99,
  "description": "Descrição do produto"
}
```

### Webhook de Notificação

**POST** `/payment/webhook`

Recebe notificações do Mercado Pago sobre mudanças de status de pagamento.

### Rotas de Retorno

- **GET** `/payment/success` - Pagamento aprovado
- **GET** `/payment/failure` - Pagamento recusado
- **GET** `/payment/pending` - Pagamento pendente

## 🧪 Testando em Sandbox

1. Vá para o Checkout usando o componente `MercadoPagoCheckout`
2. Use cartões de teste do Mercado Pago:
   - **Pagamento Aprovado**: 4111 1111 1111 1111
   - **Pagamento Pendente**: 5105 1051 0510 5100
   - **Pagamento Recusado**: 4000 0000 0000 0002

Vencimento: Qualquer data futura
CVV: Qualquer 3 dígitos

## 📝 Fluxo de Pagamento

1. Usuário preenche o formulário de checkout
2. API cria uma preferência de pagamento no Mercado Pago
3. Usuário é redirecionado para o Mercado Pago
4. Usuário completa o pagamento
5. Mercado Pago redireciona de volta para a aplicação (success/failure/pending)
6. Webhook notifica a API sobre o resultado (opcional)

## ⚙️ Próximos Passos

Para melhorar o sistema:

1. **Adicionar banco de dados** para armazenar histórico de pagamentos
2. **Implementar autenticação** para usuários
3. **Adicionar tratamento de erros** mais robusto
4. **Implementar testes** unitários e de integração
5. **Adicionar logging** para rastreamento de pagamentos
6. **Implementar retry** automático para webhooks
7. **Adicionar suporte a múltiplas moedas**

## 🔒 Segurança

- ✅ Access token armazenado em variáveis de ambiente
- ✅ Validação de webhooks
- ✅ URLs de callback configuráveis
- ⚠️ TODO: Validar assinatura de webhooks
- ⚠️ TODO: Rate limiting
- ⚠️ TODO: Validação de CORS

## 📖 Referências

- [Documentação oficial Mercado Pago](https://www.mercadopago.com.br/developers/pt)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
