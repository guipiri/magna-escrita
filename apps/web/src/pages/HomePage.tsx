import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'motion/react';
import { BookOpen, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../components/Button';
import { getBookByMagnificCode } from '../services/book-service';

export function HomePage() {
  const navigate = useNavigate();
  const [magnificCode, setMagnificCode] = useState('');
  const [message, setMessage] = useState('');

  const lookupMutation = useMutation({
    mutationFn: (code: string) => getBookByMagnificCode(code),
    onSuccess: (_book, code) => {
      navigate(`/book/${encodeURIComponent(code)}`);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setMessage(
          'Codigo magnifico nao encontrado. Verifique e tente novamente.',
        );
        return;
      }

      setMessage('Nao foi possivel buscar o livro agora. Tente novamente.');
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = magnificCode.trim();

    if (!trimmedCode) {
      setMessage('Informe um codigo magnifico para continuar.');
      return;
    }

    setMessage('');
    lookupMutation.mutate(trimmedCode);
  };

  return (
    <main className='px-4 py-12 md:py-16'>
      <div className='max-w-3xl mx-auto'>
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center'
        >
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6'>
            <Sparkles className='w-4 h-4 text-purple-600' />
            <span className='text-sm text-purple-700'>
              A magia comeca com um codigo
            </span>
          </div>

          <h1 className='text-4xl md:text-5xl lg:text-6xl mb-4 bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent'>
            Encontre o livro magnifico
          </h1>
          <p className='text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed'>
            Digite o codigo magnifico recebido para abrir o livro da crianca e
            viver a historia completa.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='mt-10 bg-white/90 backdrop-blur rounded-2xl shadow-md border border-purple-100 p-6 md:p-8'
        >
          <form onSubmit={handleSubmit} className='space-y-4'>
            <label className='block text-sm font-semibold text-gray-700'>
              Codigo magnifico
            </label>
            <div className='flex flex-col md:flex-row gap-3'>
              <input
                type='text'
                value={magnificCode}
                onChange={(event) => setMagnificCode(event.target.value)}
                placeholder='Ex: R4D3M'
                className='flex-1 rounded-full border border-purple-200 bg-white px-5 py-3 text-base text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400'
              />
              <Button
                size='lg'
                type='submit'
                disabled={lookupMutation.isPending}
              >
                <BookOpen className='w-5 h-5' />
                {lookupMutation.isPending ? 'Buscando...' : 'Abrir livro'}
              </Button>
            </div>

            {message ? (
              <p className='text-sm text-pink-600'>{message}</p>
            ) : (
              <p className='text-sm text-gray-500'>
                O codigo fica no cartao entregue com o livro.
              </p>
            )}
          </form>
        </motion.section>
      </div>
    </main>
  );
}
