import { MercadoPagoCheckout } from '../components/MercadoPagoCheckout';

export function PaymentExample() {
  const handlePaymentSuccess = (preferenceId: string) => {
    console.log('Pagamento criado com sucesso. Preference ID:', preferenceId);
  };

  const handlePaymentError = (error: Error) => {
    console.error('Erro ao criar pagamento:', error);
  };

  return (
    <div className='payment-example-container'>
      <h1>Sistema de Pagamentos - Mercado Pago</h1>

      <div className='info-section'>
        <h2>Como usar:</h2>
        <ol>
          <li>
            Configure o Access Token do Mercado Pago em <code>.env</code>
          </li>
          <li>Preencha o formulário com os detalhes do produto</li>
          <li>Clique em "Ir para Mercado Pago"</li>
          <li>Complete o pagamento usando cartões de teste</li>
        </ol>
      </div>

      <MercadoPagoCheckout
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />

      <div className='test-cards-section'>
        <h3>Cartões de Teste (Sandbox)</h3>
        <div className='cards-table'>
          <div className='card-item'>
            <strong>Aprovado:</strong>
            <code>4111 1111 1111 1111</code>
          </div>
          <div className='card-item'>
            <strong>Pendente:</strong>
            <code>5105 1051 0510 5100</code>
          </div>
          <div className='card-item'>
            <strong>Recusado:</strong>
            <code>4000 0000 0000 0002</code>
          </div>
        </div>
        <p className='test-note'>
          Vencimento: Qualquer data futura | CVV: Qualquer 3 dígitos
        </p>
      </div>

      <style>{`
        .payment-example-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 40px;
        }

        .info-section {
          background: #f0f4f8;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 40px;
        }

        .info-section h2 {
          margin-top: 0;
          color: #0066cc;
        }

        .info-section ol {
          margin: 0;
          padding-left: 20px;
        }

        .info-section li {
          margin: 10px 0;
          line-height: 1.6;
        }

        .info-section code {
          background: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 13px;
        }

        .test-cards-section {
          margin-top: 40px;
          padding: 20px;
          background: #fff9e6;
          border-left: 4px solid #ff9800;
          border-radius: 4px;
        }

        .test-cards-section h3 {
          margin-top: 0;
          color: #f57c00;
        }

        .cards-table {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 15px 0;
        }

        .card-item {
          background: white;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #ffb74d;
        }

        .card-item strong {
          display: block;
          margin-bottom: 5px;
          color: #f57c00;
        }

        .card-item code {
          background: #fffde7;
          padding: 8px 12px;
          border-radius: 3px;
          display: block;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .test-note {
          margin: 15px 0 0 0;
          font-size: 13px;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

export default PaymentExample;
