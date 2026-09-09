const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'repai_webhook_2024';

export default async function webhookRoutes(fastify, options) {
  // Meta webhook verification handshake.
  fastify.get('/api/whatsapp/webhook', async (request, reply) => {
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    if (token === VERIFY_TOKEN) {
      return reply.code(200).send(challenge);
    }

    return reply.code(403).send();
  });

  // Incoming WhatsApp messages.
  fastify.post('/api/whatsapp/webhook', async (request, reply) => {
    fastify.log.info({ body: request.body }, 'Incoming WhatsApp webhook');
    return reply.code(200).send();
  });
}
