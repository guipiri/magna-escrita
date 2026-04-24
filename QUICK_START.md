# 🚀 Quick Start - Sistema de Pagamentos Mercado Pago

## Primeiros Passos (5 minutos)

### 1️⃣ Obter Access Token

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma conta
3. Vá para "Credenciais"
4. Copie o Access Token (usar o de teste/sandbox para começar)

### 2️⃣ Configurar Variáveis de Ambiente

**Backend** (`apps/api/.env`)

```env
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
APP_URL=http://localhost:5173
API_URL=http://localhost:3000
```

**Frontend** (`apps/web/.env.local`)

```env
VITE_API_URL=http://localhost:3000
```

### 3️⃣ Instalar Dependências

```bash
# Já instaladas! Mas você pode verificar:
cd apps/api
yarn list mercadopago

cd ../web
yarn list axios
```

### 4️⃣ Iniciar a Aplicação

```bash
# Terminal 1 - Backend
cd apps/api
yarn dev

# Terminal 2 - Frontend
cd apps/web
yarn dev
```

### 5️⃣ Testar

- Acesse `http://localhost:5173/payment` (depois de integrar a rota)
- Preencha o formulário
- Clique "Ir para Mercado Pago"
- Use cartão de teste: `4111 1111 1111 1111`
- Pronto! ✅

## 📁 Arquivos Criados

### Backend

```
apps/api/src/payment/
├── payment.module.ts          # Módulo NestJS
├── payment.controller.ts       # Endpoints da API
├── payment.service.ts          # Lógica de integração
├── payment.types.ts            # TypeScript types
├── payment.service.spec.ts     # Testes do serviço
└── payment.controller.spec.ts  # Testes do controller
```

### Frontend

```
apps/web/src/
├── services/
│   └── paymentService.ts       # Cliente HTTP
├── components/
│   └── MercadoPagoCheckout.tsx # Componente formulário
└── pages/
    ├── PaymentExample.tsx      # Página de exemplo
    └── PaymentStatusPage.tsx   # Página de confirmação
```

### Documentação

```
├── PAYMENT_SYSTEM.md           # Documentação completa
├── PAYMENT_EXAMPLES.md         # Exemplos de uso
└── .env.example                # Template variáveis
```

## 🔌 Endpoints Disponíveis

| Método | Endpoint                     | Descrição                     |
| ------ | ---------------------------- | ----------------------------- |
| POST   | `/payment/create-preference` | Cria preferência de pagamento |
| GET    | `/payment/status/:id`        | Obtém status do pagamento     |
| POST   | `/payment/webhook`           | Webhook de notificações       |
| GET    | `/payment/success`           | Callback de sucesso           |
| GET    | `/payment/failure`           | Callback de falha             |
| GET    | `/payment/pending`           | Callback de pendência         |

## 🎴 Cartões de Teste

| Status      | Número              | CVV      | Venc     |
| ----------- | ------------------- | -------- | -------- |
| ✅ Aprovado | 4111 1111 1111 1111 | Qualquer | Qualquer |
| ⏳ Pendente | 5105 1051 0510 5100 | Qualquer | Qualquer |
| ❌ Recusado | 4000 0000 0000 0002 | Qualquer | Qualquer |

## 📚 Documentação Completa

- [PAYMENT_SYSTEM.md](./PAYMENT_SYSTEM.md) - Documentação detalhada
- [PAYMENT_EXAMPLES.md](./PAYMENT_EXAMPLES.md) - Exemplos práticos
- [Mercado Pago Docs](https://www.mercadopago.com.br/developers)

## 🐛 Troubleshooting

### Erro: "Access Token inválido"

- ✅ Verificar se `.env` está com o token correto
- ✅ Token não pode ter espaços em branco
- ✅ Usar token de sandbox para testes

### Erro: "CORS error"

- ✅ Verificar `APP_URL` e `API_URL` no `.env`
- ✅ Frontend e Backend rodam em porta diferente? Normal!
- ✅ Mercado Pago cuida do CORS

### Componente não carrega

- ✅ Verificar se `VITE_API_URL` está em `.env.local`
- ✅ Verificar se backend está rodando
- ✅ Verificar console do navegador para erros

### Pagamento redireciona para branco

- ✅ Token de acesso pode estar inválido
- ✅ Verificar se a preferência foi criada com sucesso
- ✅ Verificar aba Network do DevTools

## ✨ Próximos Passos

1. ✅ **Integração básica** - Você já fez!
2. ⬜ Adicionar banco de dados para histórico
3. ⬜ Integrar com autenticação de usuários
4. ⬜ Implementar dashboard de vendas
5. ⬜ Adicionar suporte a refunds
6. ⬜ Configurar email de confirmação

## 💡 Tips

- Use modo sandbox enquanto não tiver acesso real ao Mercado Pago
- Sempre valide dados no backend
- Implemente logging de todos os webhooks
- Teste com todos os 3 tipos de cartão
- Em produção, use Access Token produção

## 📞 Suporte

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Issues GitHub Mercado Pago](https://github.com/mercadopago/sdk-nodejs/issues)

---

**Sistema criado com ❤️ usando NestJS, React e Mercado Pago**
