import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPaymentStatus } from '../services/paymentService';

export function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentId = searchParams.get('payment_id');
  const statusParam = searchParams.get('status');

  useEffect(() => {
    const fetchStatus = async () => {
      if (!paymentId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getPaymentStatus(paymentId);
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [paymentId]);

  const getStatusMessage = () => {
    if (statusParam === 'approved' || status?.status === 'approved') {
      return {
        title: '✓ Pagamento Aprovado!',
        description: 'Seu pagamento foi processado com sucesso.',
        color: '#4CAF50',
      };
    }

    if (statusParam === 'pending' || status?.status === 'pending') {
      return {
        title: '⏳ Pagamento Pendente',
        description:
          'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.',
        color: '#FF9800',
      };
    }

    return {
      title: '✗ Pagamento Recusado',
      description:
        'Ocorreu um erro ao processar seu pagamento. Tente novamente.',
      color: '#F44336',
    };
  };

  const statusMessage = getStatusMessage();

  return (
    <div className='payment-status-container'>
      <div
        className='status-card'
        style={{ borderTop: `4px solid ${statusMessage.color}` }}
      >
        <h1 style={{ color: statusMessage.color }}>{statusMessage.title}</h1>

        <p className='description'>{statusMessage.description}</p>

        {loading ? (
          <p>Carregando informações do pagamento...</p>
        ) : error ? (
          <div className='error-box'>{error}</div>
        ) : status ? (
          <div className='status-details'>
            <p>
              <strong>ID do Pagamento:</strong> {status.id}
            </p>
            <p>
              <strong>Status:</strong> {status.status}
            </p>
            <p>
              <strong>Valor:</strong> R$ {status.transaction_amount?.toFixed(2)}
            </p>
            {status.description && (
              <p>
                <strong>Descrição:</strong> {status.description}
              </p>
            )}
          </div>
        ) : null}

        <a href='/' className='back-button'>
          Voltar para Home
        </a>
      </div>

      <style>{`
        .payment-status-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .status-card {
          background: white;
          border-radius: 8px;
          padding: 40px;
          max-width: 500px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .status-card h1 {
          margin: 0 0 20px 0;
          font-size: 28px;
        }

        .description {
          font-size: 16px;
          color: #666;
          margin-bottom: 30px;
          line-height: 1.6;
        }

        .status-details {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 4px;
          margin-bottom: 30px;
        }

        .status-details p {
          margin: 10px 0;
          font-size: 14px;
        }

        .error-box {
          background: #ffebee;
          border-left: 4px solid #f44336;
          padding: 15px;
          margin-bottom: 20px;
          color: #c62828;
          border-radius: 4px;
        }

        .back-button {
          display: inline-block;
          background-color: #667eea;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .back-button:hover {
          background-color: #5568d3;
        }
      `}</style>
    </div>
  );
}

export default PaymentStatusPage;
