import { motion } from 'motion/react';

export function OrdersPage() {
  return (
    <main className='max-w-5xl mx-auto px-4 py-6 md:py-10'>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='mb-8 text-center'
      >
        <h1 className='text-4xl md:text-5xl lg:text-6xl mb-4 bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent'>
          Seus pedidos
        </h1>
        <p className='text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed'>
          Aqui voce vai acompanhar seu historico de compras.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className='rounded-2xl border border-purple-100 bg-white/90 backdrop-blur p-6 text-center shadow-md'
      >
        <div className='text-sm text-purple-700 bg-purple-50 inline-flex px-3 py-1 rounded-full mb-4'>
          Em breve
        </div>
        <p className='text-gray-600'>
          Estamos preparando a listagem completa dos seus pedidos.
        </p>
      </motion.section>
    </main>
  );
}
