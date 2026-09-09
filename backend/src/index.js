import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import webhookRoutes from './routes/webhook.js';

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
});

await fastify.register(webhookRoutes);

fastify.get('/', async () => {
  return { status: 'ok' };
});

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
